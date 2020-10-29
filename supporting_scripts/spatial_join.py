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

with open('../data/cleveland_neighborhood_populations.csv', 'r') as f:
	population_data = [x for x in csv.DictReader(f)]

for row in population_data:
	row['Neighborhood'] = row['\ufeffNeighborhood']


for x, row in enumerate(geojson_data['features']):
	year_range = range(2014,2021)
	eviction_totals = {}
	neighborhood = row['properties']['SPA_NAME']

	for pop_row in population_data:
		if pop_row['Neighborhood'] == neighborhood:
			geojson_data['features'][x]['properties']['population'] = int(pop_row['Population'])

	if 'population' not in geojson_data['features'][x]['properties'].keys():
		print(neighborhood)

	for year in year_range:
		for i, row in df.iterrows():
			if row['Neighborhood'] == neighborhood and row['Year'] == year:
				eviction_totals[year] = row['Eviction Filing Count']

	geojson_data['features'][x]['properties']['eviction_filings'] = eviction_totals
	print(neighborhood, eviction_totals)



with open("../data/final_cleveland_neighborhoods.geojson", 'w') as f:
	json.dump(geojson_data, f)



# Merge this data back to the original neighborhood geodata
# merged_areas = neighborhoods.merge(df, on='SPA_NAME', how='outer')

# print(merged_areas.head(10))

# sjoin_evictions.to_file('test.csv')