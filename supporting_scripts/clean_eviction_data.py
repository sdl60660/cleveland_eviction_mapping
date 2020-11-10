
import csv


with open('../data/eviction_data.csv', 'r') as f:
	eviction_data = [x for x in csv.DictReader(f)]

cleaned_data = {}
for case in eviction_data:
	if "EVICTION" in case['Action']:
		case['Property City'] = case['Property City'].strip()
		if case['Property City'] = ',':
			case['Property City'] = 'Cleveland, OH'
		case['Plaintiff City'] = case['Plaintiff City'].strip()
		if '' in case.keys():
			del case['']

		cleaned_data[case['Case Number']] = case

cleaned_data = list(cleaned_data.values())
fields = list(cleaned_data[0].keys())

with open('../data/cleaned_eviction_data.csv', 'w') as f:
	out_csv = csv.DictWriter(f, fieldnames=fields)
	out_csv.writeheader()

	for row in cleaned_data:
		out_csv.writerow(row)



