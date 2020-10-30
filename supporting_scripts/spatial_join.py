import pandas as pd
import geopandas as gpd

import json
import csv

# Read in evictions data to a dataframe and convert to a geopandas dataframe
evictions = pd.read_csv('../data/geocoded_eviction_data.csv')

evictions = evictions[evictions['Property City'] != ',']
evictions = evictions.dropna(subset=['lat', 'lng'])
evictions['file_year'] = pd.DatetimeIndex(evictions['File Date']).year

gdf_evictions = gpd.GeoDataFrame(evictions, geometry=gpd.points_from_xy(evictions.lng, evictions.lat))


# Read in neighborhoods geojson file
geojson_file = "../data/corrected_cleveland_neighborhoods.geojson"
neighborhoods = gpd.read_file(geojson_file)
print(neighborhoods.head())


# Spatial join the evictions to neighborhoods
sjoin_evictions = gpd.sjoin(gdf_evictions.set_crs("EPSG:4326"), neighborhoods, op="within")
print(sjoin_evictions.head())


# Group spatial-joined dataframe by neighborhood (SPA_NAME) and year
grouped = sjoin_evictions.groupby(["SPA_NAME", "file_year"]).size()
df = grouped.to_frame().reset_index()
df.columns = ["Neighborhood", "Year", "Eviction Filing Count"]

df.to_csv('../data/neighborhood_eviction_data.csv')


with open(geojson_file, 'r') as f:
	geojson_data = json.load(f)

# with open('../data/cleveland_neighborhood_populations.csv', 'r') as f:
# 	population_data = [x for x in csv.DictReader(f)]

with open('../data/cleveland_neighborhood_home_values.csv', 'r') as f:
	housing_value_data = [x for x in csv.DictReader(f)]


# for row in population_data:
# 	row['Neighborhood'] = row['\ufeffNeighborhood']


for x, row in enumerate(geojson_data['features']):
	year_range = range(2014,2021)
	eviction_totals = {}
	housing_value_changes = {}
	neighborhood = row['properties']['SPA_NAME']

	# for pop_row in population_data:
	# 	if pop_row['Neighborhood'] == neighborhood:
	# 		geojson_data['features'][x]['properties']['population'] = int(pop_row['Population'])

	for year in year_range:
		for i, row in df.iterrows():
			if row['Neighborhood'] == neighborhood and row['Year'] == year:
				eviction_totals[year] = row['Eviction Filing Count']


		for j, row in enumerate(housing_value_data):
			if row['RegionName'] == neighborhood:
				try:
					housing_value_change = (float(row[f'6/30/{(year) - 2000}']) - float(row[f'6/30/{(year-1) - 2000}'])) / float(row[f'6/30/{(year-1) - 2000}'])
				except ValueError:
					housing_value_change = ''

				housing_value_changes[year] = housing_value_change



	geojson_data['features'][x]['properties']['eviction_filings'] = eviction_totals
	geojson_data['features'][x]['properties']['housing_value_changes'] = housing_value_changes
	print(neighborhood, eviction_totals, housing_value_changes)



with open("../data/cleveland_neighborhoods_with_evictions.geojson", 'w') as f:
	json.dump(geojson_data, f)



# Merge this data back to the original neighborhood geodata
# merged_areas = neighborhoods.merge(df, on='SPA_NAME', how='outer')

# print(merged_areas.head(10))

# sjoin_evictions.to_file('test.csv')