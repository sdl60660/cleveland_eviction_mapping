import csv
import json

from geocodio import GeocodioClient

from config.settings import GEOCODIO_API_KEY


with open('../data/cleaned_eviction_data.csv', 'r') as f:
	eviction_data = [x for x in csv.DictReader(f)]

client = GeocodioClient(GEOCODIO_API_KEY)

total_records = len(eviction_data)
chunk_size = 8000
current_index = 0

out_records = []

while current_index < total_records:
	if total_records - current_index < chunk_size:
		chunk_size = total_records - current_index

	record_chunk = [x for x in eviction_data[current_index:current_index+chunk_size] if x['lat'] == '']
	known_coordinates = [x for x in eviction_data[current_index:current_index+chunk_size] if x['lat'] != '']

	print(current_index, chunk_size, total_records, len(record_chunk))

	locations = client.geocode([f"{x['Property Address']} {x['Property City']}" for x in record_chunk])

	for i, rec in enumerate(record_chunk):
		# print(i)
		try:
			rec['lat'] = locations[i]['results'][0]['location']['lat']
			rec['lng'] = locations[i]['results'][0]['location']['lng']
		except IndexError:
			rec['lat'] = None
			rec['lng'] = None

		out_records.append(rec)

	out_records += known_coordinates
	current_index += chunk_size

with open('../data/geocoded_eviction_data.csv', 'w') as f:
	out_csv = csv.DictWriter(f, fieldnames=list(out_records[0].keys()))
	out_csv.writeheader()
	for row in out_records:
		out_csv.writerow(row)