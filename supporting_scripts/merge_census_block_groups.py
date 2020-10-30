import pandas as pd
import geopandas as gpd

import json
import csv


neighborhood_geojson = "../data/cleveland_neighborhoods_with_evictions.geojson"
neighborhoods = gpd.read_file(neighborhood_geojson)
print(neighborhoods.head())


census_block_geojson = "../data/cle_centroid_demos.geojson"
census_blocks = gpd.read_file(census_block_geojson)


sjoin_census_blocks = gpd.sjoin(census_blocks.to_crs("EPSG:4326"), neighborhoods.to_crs("EPSG:4326"), op="within")
print(sjoin_census_blocks.columns)

grouped_sum = sjoin_census_blocks.groupby(["SPA_NAME"]).sum()
sum_cols = ["pop", "black", "latino", "white", "total_HH", "occ_status", "vacant", "renters", "owners", "total_tenure"]
grouped_sum = grouped_sum[sum_cols]
print(grouped_sum.head())

grouped_median = sjoin_census_blocks.groupby(["SPA_NAME"]).median()
median_cols = ["med_cont_rent", "med_hh_inc", "med_house_val"]
grouped_median = grouped_median[median_cols]
print(grouped_median.head())


df = neighborhoods.join(grouped_sum, on="SPA_NAME", how="left").join(grouped_median, on="SPA_NAME", how="left")

df.to_file("../data/census_merged_cleveland_neighborhoods.geojson", driver="GeoJSON")
df.to_file("../static/data/cleveland_neighborhoods.geojson", driver="GeoJSON")

