import csv
import json

from geocodio import GeocodioClient


with open('../data/cleaned_eviction_data.csv', 'r') as f:
	eviction_data = [x for x in csv.DictReader(f)]

API_KEY = "fdf7422c5587c95ff9f3c9289fd2f79f14df984"
client = GeocodioClient(API_KEY)

total_records = len(eviction_data)
chunk_size = 8000
current_index = 0

out_records = []

while current_index < total_records:
	if total_records - current_index < chunk_size:
		chunk_size = total_records - current_index

	record_chunk = eviction_data[current_index:current_index+chunk_size]

	print(current_index, chunk_size, total_records)

	locations = client.geocode([f"{x['Property Address']} {x['Property City']}" for x in record_chunk])

	for i, rec in enumerate(record_chunk):
		print(i)
		try:
			rec['lat'] = locations[i]['results'][0]['location']['lat']
			rec['lng'] = locations[i]['results'][0]['location']['lng']
		except IndexError:
			rec['lat'] = None
			rec['lng'] = None

		out_records.append(rec)

	current_index += chunk_size

with open('../data/geocoded_eviction_data.csv', 'w') as f:
	out_csv = csv.DictWriter(f, fieldnames=list(out_records[0].keys()))
	out_csv.writeheader()
	for row in out_records:
		out_csv.writerow(row)