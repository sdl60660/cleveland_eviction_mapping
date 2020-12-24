import pandas as pd
import geopandas as gpd

import json
import csv


# Read in evictions data to a dataframe and convert to a geopandas dataframe
evictions = pd.read_csv('../data/geocoded_eviction_data.csv')

# Remove any rows with missing Property City
evictions = evictions[evictions['Property City'] != ',']

# Remove any rows that could not be geocoded, or were geocoded incorrectly to the geographic center of the city (in Industrial Valley, at 41.489381, -81.667486)
evictions = evictions.dropna(subset=['lat', 'lng'])
evictions = evictions[(evictions['lat'] != 41.489381) & (evictions['lng'] != -81.667486)]

# Add a file year, rather than date for easier filtering on the front-end
evictions['file_year'] = pd.DatetimeIndex(evictions['File Date']).year

gdf_evictions = gpd.GeoDataFrame(evictions, geometry=gpd.points_from_xy(evictions.lng, evictions.lat), crs="EPSG:4326")


# Read in neighborhoods geojson file
geojson_file = "../data/corrected_cleveland_neighborhoods.geojson"
neighborhoods = gpd.read_file(geojson_file, crs="EPSG:4326")
print(neighborhoods.head())


# Spatial join the evictions to neighborhoods
sjoin_evictions = gpd.sjoin(gdf_evictions, neighborhoods, op="within")
print(sjoin_evictions.head())

# Save a copy of evictions with attached neighborhoods
sjoin_evictions.to_csv('../data/geocoded_eviction_data_with_neighborhoods.csv')

# Create/save files for viz and kaggle upload
viz_file_columns = ['Case Number', 'Case Status', 'File Date', 'Property Address', 'Plaintiff', 'Disposition Status', 'lat', 'lng', 'SPA_NAME']
kaggle_file_columns = ['Case Number', 'Case Status', 'File Date', 'Action', 'Defendants', 'Property Address', 'Property City', 'Plaintiff', 'Plaintiff Address', 'Plaintiff City', 'Costs', 'Disposition Date', 'lat', 'lng', 'SPA_NAME', 'Last Updated']

sjoin_evictions[viz_file_columns].to_csv('../static/data/geocoded_eviction_data_with_neighborhoods.csv', index=False)

kaggle_df = sjoin_evictions[kaggle_file_columns]
kaggle_df['Defendants'] = '[Redacted]'
kaggle_df['Neighborhood'] = kaggle_df['SPA_NAME']
kaggle_df = kaggle_df.drop(['SPA_NAME'], axis=1)

kaggle_df.to_csv('../data/redacted_kaggle_upload.csv', index=False)

# Group spatial-joined dataframe by neighborhood (SPA_NAME) and year
grouped = sjoin_evictions.groupby(["SPA_NAME", "file_year"]).size()
df = grouped.to_frame().reset_index()
df.columns = ["Neighborhood", "Year", "Eviction Filing Count"]

df.to_csv('../data/neighborhood_eviction_data.csv')


# Filter out CMHA evictions and create filtered dataframe to attach to GeoJSON data
grouped_filtered = sjoin_evictions.loc[sjoin_evictions['Plaintiff'] != 'CMHA'].groupby(['SPA_NAME', 'file_year']).size()
filtered_df = grouped_filtered.to_frame().reset_index()
filtered_df.columns = ["Neighborhood", "Year", "Eviction Filing Count"]

print(filtered_df.head())


with open(geojson_file, 'r') as f:
	geojson_data = json.load(f)

# with open('../data/cleveland_neighborhood_populations.csv', 'r') as f:
# 	population_data = [x for x in csv.DictReader(f)]

with open('../data/cleveland_neighborhood_home_values.csv', 'r') as f:
	housing_value_data = [x for x in csv.DictReader(f)]


# for row in population_data:
# 	row['Neighborhood'] = row['\ufeffNeighborhood']


for x, row in enumerate(geojson_data['features']):
	year_range = range(2011, 2021)
	eviction_totals = {}
	filtered_eviction_totals = {}
	housing_value_changes = {}
	neighborhood = row['properties']['SPA_NAME']

	# for pop_row in population_data:
	# 	if pop_row['Neighborhood'] == neighborhood:
	# 		geojson_data['features'][x]['properties']['population'] = int(pop_row['Population'])

	for year in year_range:
		for i, row in df.iterrows():
			if row['Neighborhood'] == neighborhood and row['Year'] == year:
				eviction_totals[year] = row['Eviction Filing Count']

		for i, row in filtered_df.iterrows():
			if row['Neighborhood'] == neighborhood and row['Year'] == year:
				filtered_eviction_totals[year] = row['Eviction Filing Count']


		for j, row in enumerate(housing_value_data):
			if row['RegionName'] == neighborhood:
				try:
					housing_value_change = (float(row[f'9/30/{(year) - 2000}']) - float(row[f'9/30/{(year-1) - 2000}'])) / float(row[f'9/30/{(year-1) - 2000}'])
				except ValueError:
					housing_value_change = ''

				housing_value_changes[year] = housing_value_change



	geojson_data['features'][x]['properties']['eviction_filings'] = eviction_totals
	geojson_data['features'][x]['properties']['filtered_eviction_filings'] = filtered_eviction_totals
	geojson_data['features'][x]['properties']['housing_value_changes'] = housing_value_changes
	print(neighborhood, eviction_totals, housing_value_changes)



with open("../data/cleveland_neighborhoods_with_evictions.geojson", 'w') as f:
	json.dump(geojson_data, f)



# Merge this data back to the original neighborhood geodata
# merged_areas = neighborhoods.merge(df, on='SPA_NAME', how='outer')

# print(merged_areas.head(10))

# sjoin_evictions.to_file('test.csv')