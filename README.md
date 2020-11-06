# Cleveland Eviction Mapping

I scraped data from the Cleveland Municipal court site on eviction filings from 2014 to 2020. I gathered population, demographic, and home value data from Zillow and the U.S. Census and mapped the per household eviction filing rates next to various demographics. Below, I included a leaflet map to view addresses/data regarding individual eviction filings in a neighborhood.

Live site: https://cleveland-evictions.herokuapp.com/

Project was built using:
* Python/Selenium/BeautifulSoup for scraping data
* GeoPandas for spatially joining geocoded eviction data to neighborhoods
* R for gathering ACS demographic data by census block group
* HTML/CSS/JavaScript/jQuery for basic front-end construction
* D3/Leaflet for visualizations
* Heroku for hosting