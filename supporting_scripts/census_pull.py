from census import Census
from us import states


with open('census_api_key.txt', 'r') as f:
    key = f.readline().strip('\n')

c = Census(key)

cuyahoga_county_id = '035'
ohio_state_id = states.OH.fips

census_fields = {
    'Median Gross Rent': 'B25031_001',
    'Median Value of Housing Units': 'B25097_001',
    'Population': 'B01003_001E'
}

cuyahoga_block_groups = c.acs5.get(['NAME', 'B01003_001E', 'B25031_001E', 'B25097_001E'], geo={'for': 'block group:*', 'in': f'state:{ohio_state_id} county:{cuyahoga_county_id}'})
print(cuyahoga_block_groups)