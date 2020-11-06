

NeighborhoodMap = function(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
};

NeighborhoodMap.prototype.initVis = function() {
    const vis = this;

    // Init map and disallow zooming out past initial zoom level
    vis.map = L.map(vis.parentElement, {'minZoom': 11})
    	.setView([41.4993, -81.6944], 11);

    // Add tile layer
    L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
	    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(vis.map);

    // Set max bounds
	vis.map.setMaxBounds(vis.map.getBounds());

	vis.featuredNeighborhood = null;
	vis.markers = [];

    vis.wrangleData();
};


NeighborhoodMap.prototype.wrangleData = function() {
    const vis = this;

    // Create polygons from geoJSON data and add them to the map
	vis.polygons = L.geoJson(geoData).addTo(vis.map)
		.setStyle({'fillOpacity': 0.1, 'weight': 2});

	// Create dict of Leaflet polygon IDs and neighborhood names flor lookup
	vis.layerDict = {};
	vis.polygons.eachLayer((layer) => {
		vis.layerDict[layer.feature.properties.SPA_NAME] = layer._leaflet_id;
	});


	// Set up double-click event on neighborhood polygons, but temporarily disable the normal
	// map double-click event so that it doesn't fire
	vis.polygons.on('click', (event) => {
		vis.map.doubleClickZoom.disable();
		setTimeout(() => {vis.map.doubleClickZoom.enable()}, 500);
	})

	// On polygon double-click, zoom to/highlight polygon (as well as display eviction filings as markers)
	vis.polygons.on('dblclick', (event) => {
	    vis.zoomToNeighborhood(event.sourceTarget.feature.properties.SPA_NAME);
	    vis.map.doubleClickZoom.enable();
	});

};


NeighborhoodMap.prototype.zoomToNeighborhood = function(neighborhoodName) {
	const vis = this;

	vis.featuredNeighborhood = neighborhoodName;

	vis.polygons
		.setStyle({'fillOpacity': 0.1, 'weight': 2, 'color': '#3388ff', 'fillColor': '#3388ff', 'fillOpacity': 0.1})

	let zoomNeighborhood = vis.polygons.getLayer(vis.layerDict[neighborhoodName]);
	vis.map.fitBounds(zoomNeighborhood.getBounds());
	zoomNeighborhood.setStyle({'color': 'black', 'weight': 3, 'fillColor': 'yellow', 'fillOpacity': 0.08});

	vis.plotNeighborhoodEvictions(neighborhoodName, currentYear);
};


NeighborhoodMap.prototype.plotNeighborhoodEvictions = function(neighborhoodName, year) {
	const vis = this;

	vis.markers.forEach(marker => {
		vis.map.removeLayer(marker);
	})

	vis.featuredEvictionData = allEvictions.slice().filter(d => +d.file_year === +year && d.SPA_NAME === neighborhoodName)
	vis.featuredEvictionData.forEach(eviction_filing => {

		let popupContent = `<div style="text-align:center;margin-bottom:-50px;font-size: 14px;"><strong>${eviction_filing["Property Address"]}</strong></div>`;

		popupContent += '<table>';

		popupContent += `<tr><td><span>File Date:</span></td> <td><span>${eviction_filing['File Date']}</span></td></tr><br>`;
		popupContent += `<tr><td><span>Plaintiff:</span></td> <td><span>${eviction_filing['Plaintiff']}</span></td></tr><br>`;
		popupContent += `<tr><td><span>Case Number:</span></td> <td><span>${eviction_filing['Case Number']}</span></td></tr><br>`;
		popupContent += `<tr><td><span>Case Status:</span></td> <td><span>${eviction_filing['Case Status']} - ${eviction_filing['Disposition Status']}</span></td></tr><br>`;


		popupContent += '</table>';

		let popup = L.popup()
			.setContent(popupContent);

		let marker = new L.circle([eviction_filing['lat'], eviction_filing['lng']], 12, {
			fillOpacity: 0.6,
			stroke: 0.2
			// color: "black"
		})
			.bindPopup(popup)
			.addTo(vis.map);

		vis.markers.push(marker);
	})

};


