import csv


with open('../cleveland_scraper/data/full_data.csv', 'r') as f:
	new_data = {case['Case Number']: case for case in csv.DictReader(f) if "EVICTION" in case['Action']}
	new_case_ids = list(new_data.keys())


try:
	with open('../data/geocoded_eviction_data_with_neighborhoods.csv', 'r') as f:
		existing_data = {x['Case Number']: x for x in csv.DictReader(f)}
		existing_case_ids = list(existing_data.keys())
except FileNotFoundError:
	existing_data = {}
	existing_case_ids = []


for case_number, case in new_data.items():
	if case['Property City'] == ',':
			case['Property City'] = 'Cleveland, OH'

	try:
		case['lat'] = existing_data[case_number]['lat']
		case['lng'] = existing_data[case_number]['lng']
	except KeyError:
		case['lat'] = case['lng'] = ''


cleaned_data = list(new_data.values())
fields = list(cleaned_data[0].keys())

with open('../data/cleaned_eviction_data.csv', 'w') as f:
	out_csv = csv.DictWriter(f, fieldnames=fields)
	out_csv.writeheader()

	for row in cleaned_data:
		out_csv.writerow(row)