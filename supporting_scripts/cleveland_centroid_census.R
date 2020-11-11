###
library(tidyverse)
library(tidylog)
library(tidycensus)
library(stringr)
library(tigris)
library(sf)

### KEY
census_api_key("a3b3e47d0fc8a2c96b3ad41144235642a02954c7", install = TRUE, overwrite=TRUE)

cle_block_groups <- block_groups(state=39, county=035, class="sf")

cle_centroids <- cle_block_groups %>%
  st_centroid()


#pull all variables
acs_18_vars <- load_variables(2018, "acs5", cache=T)

#PULL DEMOGRAPHICS
block_group_demos <- get_acs(geography="block group",
                       state=39,
                       county=035,
                       year=2018,
                       variables=c(pop ="B01003_001", total_HH ="B11001_001", 
                       total_white_HH="B11001H_001", latino = "B03003_003",
                       black = "B02001_003", white = "B02001_002", asian="B02001_005",
                       renters="B25003_003", owners="B25003_002",
                       total_tenure="B25003_001",med_house_val="B25077_001",
                       med_hh_inc="B19013_001", med_cont_rent="B25058_001",
                       occ_status="B25002_001",vacant="B25002_003",
                       pov_total = "B17001_001",in_pov = "B17001_002", 
                       rent30to35="B25070_007", rent35to40="B25070_008",
                       rent40to50="B25070_009",rent50plus="B25070_010"
                       ), geometry=F) %>%
  #remove moe
  select(-moe) %>%
  #make wide
  spread(variable, estimate) %>%
  #add in calculations on pct BIPOC hhs on fs, pct white_not_latino on fs, then scale into percentiles
  mutate(pct_renter = (renters/total_tenure),
         pct_owner = (owners/total_tenure),
         pct_rent_burden = ((rent30to35 + rent35to40 + rent40to50 + rent50plus)/renters),
         pov_rate = (in_pov/pov_total),
         vacancy_rate=(vacant/occ_status),
         pct_white = (white/pop),
         pct_latino = (latino/pop),
         pct_black = (black/pop)
         ) %>%
  as.data.frame()


centroid_demos <- cle_centroids %>%
  left_join(block_group_demos, by="GEOID")

st_write(centroid_demos, "../data/cle_centroid_demos.geojson")

