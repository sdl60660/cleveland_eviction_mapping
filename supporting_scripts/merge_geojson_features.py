import json
import geojson
from functools import partial
import pyproj
import shapely.geometry
import shapely.ops

# reading into two geojson objects, in a GCS (WGS84)
with open('../data/cleveland_neighborhoods_geo.json') as f:
    geojson_data = json.load(f)


merged_feature_names = ['Lee-Harvard', 'Lee-Seville']
output_feature_name = 'Lee Miles'

# pulling out the polygons
polygons = []
for feature in merged_feature_names:
	for json_feature in geojson_data['features']:
		if json_feature['properties']['SPA_NAME'] == feature:
			polygons.append(shapely.geometry.asShape(json_feature['geometry']))

# checking to make sure they registered as polygons
print(polygons)

# merging the polygons - they are feature collections, containing a point, a polyline, and a polygon - I extract the polygon
# for my purposes, they overlap, so merging produces a single polygon rather than a list of polygons
mergedPolygon = polygons[0].union(polygons[1])

# using geojson module to convert from WKT back into GeoJSON format
geojson_out = geojson.Feature(geometry=mergedPolygon, properties={'SPA_NAME': output_feature_name})

print(geojson_out)