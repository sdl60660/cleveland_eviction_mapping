

NeighborhoodMap = function(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
};

NeighborhoodMap.prototype.initVis = function() {
    const vis = this;

    const minZoomLevel = phoneBrowsing === true ? 10 : 11;

    // Init map and disallow zooming out past initial zoom level
    vis.map = L.map(vis.parentElement, {'minZoom': minZoomLevel})
    	.setView([41.4993, -81.6944], minZoomLevel);

    // Add tile layer
	L.tileLayer('https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey={apikey}', {
		attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		apikey: '4aaabd65bd1b4acc907723a3a59e92f6',
		maxZoom: 22
	}).addTo(vis.map);

    // Set max bounds
	vis.map.setMaxBounds(vis.map.getBounds());

	vis.markers = [];

    vis.wrangleData();
};


NeighborhoodMap.prototype.wrangleData = function() {
    const vis = this;

    // Create polygons from geoJSON data and add them to the map
	vis.polygons = L.geoJson(geoData).addTo(vis.map)
		.setStyle({'fillOpacity': 0.1, 'weight': 2, 'className': 'neighborhoodPolygon'});

	// Create dict of Leaflet polygon IDs and neighborhood names flor lookup
	vis.layerDict = {};
	vis.polygons.eachLayer((layer) => {
		vis.layerDict[layer.feature.properties.SPA_NAME] = layer._leaflet_id;
	});


	if (phoneBrowsing === false) {
		// Set up double-click event on neighborhood polygons, but temporarily disable the normal
		// map double-click event so that it doesn't fire
		vis.polygons.on('click', (event) => {
			vis.map.doubleClickZoom.disable();
			setTimeout(() => {vis.map.doubleClickZoom.enable()}, 500);
		})

		// On polygon double-click, zoom to/highlight polygon (as well as display eviction filings as markers)
		vis.polygons.on('dblclick', (event) => {
			if (featuredNeighborhood === event.sourceTarget.feature.properties.SPA_NAME) {
				vis.resetZoom();
			}
			else {
		    	vis.zoomToNeighborhood(event.sourceTarget.feature.properties.SPA_NAME);
			}
			timelineChart.wrangleData();
		    vis.map.doubleClickZoom.enable();
		});
	}
	else {
		vis.polygons.on('click', (event) => {
			timelineChart.wrangleData();
			if (featuredNeighborhood === event.sourceTarget.feature.properties.SPA_NAME) {
				vis.resetZoom();
			}
			else {
		    	vis.zoomToNeighborhood(event.sourceTarget.feature.properties.SPA_NAME);
			}
		});
	}

	vis.setInfoBox();
	vis.setLegend();
	vis.addSlider();

};


NeighborhoodMap.prototype.resetZoom = function() {
	const vis = this;

	featuredNeighborhood = null;

	// Reset styling on all polygons
	vis.polygons
		.setStyle({'fillOpacity': 0.1, 'weight': 2, 'color': '#3388ff', 'fillColor': '#3388ff', 'fillOpacity': 0.1});

	// Remove any markers
	vis.markers.forEach(marker => {
		vis.map.removeLayer(marker);
	})

	// Reset zoom/view
	vis.map
		.setView([41.4993, -81.6944], 11);

	// Reset info box
	vis.info.update();

	// Remove legend
	vis.map.removeControl(vis.legend);

}


NeighborhoodMap.prototype.zoomToNeighborhood = function(neighborhoodName) {
	const vis = this;

	featuredNeighborhood = neighborhoodName;

	vis.polygons
		.setStyle({'fillOpacity': 0.1, 'weight': 2, 'color': '#3388ff', 'fillColor': '#3388ff', 'fillOpacity': 0.1});

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

	vis.featuredEvictionData = allEvictions.slice().filter(d => +d.year === +year && d.SPA_NAME === neighborhoodName)
	vis.featuredEvictionData.forEach(eviction_filing => {

		let popupContent = `<div style="text-align:center;margin-bottom:-50px;font-size: 14px;"><strong>${eviction_filing["Property Address"]}</strong></div>`;

		popupContent += '<table class="leaflet-tooltip-table">';

		popupContent += `<tr><td><span>File Date:</span></td> <td><span>${eviction_filing['File Date']}</span></td></tr><br>`;
		popupContent += `<tr><td><span>Plaintiff:</span></td> <td><span>${eviction_filing['Plaintiff']}</span></td></tr><br>`;
		popupContent += `<tr><td><span>Case Number:</span></td> <td><span>${eviction_filing['Case Number']}</span></td></tr><br>`;
		popupContent += `<tr><td><span>Case Status:</span></td> <td><span>${eviction_filing['Case Status']} - ${eviction_filing['Disposition Status']}</span></td></tr><br>`;


		popupContent += '</table>';

		let popup = L.popup()
			.setContent(popupContent);

		let marker = new L.CircleMarker([eviction_filing['lat'], eviction_filing['lng']], {
			fillColor: (eviction_filing['Plaintiff'] === "CMHA") ? "red" : "#3388ff",
            color: "black",
            weight: 1,
            opacity: 1,
			fillOpacity: 0.5,
			radius: 5
		})
			.bindPopup(popup)
			.addTo(vis.map);

		vis.markers.push(marker);
	})

	vis.info.update(neighborhoodName, vis.featuredEvictionData.length);
	vis.legend.addTo(vis.map);

};


NeighborhoodMap.prototype.setInfoBox = function() {
	const vis = this;

	vis.info = L.control();

	vis.info.onAdd = function(map) {
	    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
	    this.update();
	    return this._div;
	};

	// method that we will use to update the control based on feature properties passed
	vis.info.update = function(name, count) {
	    this._div.innerHTML = (name ?
	        `<b>${name} (${currentYear})</b><br>${count} Evictions`
	        : phoneBrowsing === true ? '(Tap a neighborhood)' : '(Double-click a neighborhood)');
	};

	vis.info.addTo(vis.map);
};


NeighborhoodMap.prototype.setLegend = function() {
	const vis = this;

	vis.legend = L.control({position: 'bottomright'});

	vis.legend.onAdd = function (map) {
	
	    vis.legendDiv = L.DomUtil.create('div', 'info legend');
	    let labels = ["CMHA Plaintiff", "Non-CMHA Plaintiff"];
	    let colors = ["red", "#3388ff"];

	    // loop through our density intervals and generate a label with a colored square for each interval
	    for (var i = 0; i < labels.length; i++) {
	        vis.legendDiv.innerHTML +=
	            `<i style="background: ${colors[i]}"></i><span style="float:left">${labels[i]}</span><br>`;
		    }

		return vis.legendDiv;
	};
};

NeighborhoodMap.prototype.addSlider = function() {
	const vis = this;

	L.Control.MyControl = L.Control.extend({
		onAdd: function(map) {
			let el = L.DomUtil.create('div', 'leaflet-bar my-control');

			el.innerHTML = `<div class="range-value" id="map-year-slider-label"></div> \
            <input type="range" class="year-slider" id="map-year-slider" name="year-select" min="2011" max="2020" step="1" value="2019">`

			return el;
		},

		onRemove: function(map) {
			// Nothing to do here
		}
	});

	L.control.myControl = function(opts) {
		return new L.Control.MyControl(opts);
	}

	vis.mapSlider = L.control.myControl({
		position: 'bottomleft'
	}).addTo(vis.map);

	vis.mapSlider.getContainer().addEventListener('mouseover', () => {
        vis.map.dragging.disable();
    });

    vis.mapSlider.getContainer().addEventListener('mouseout', () => {
        vis.map.dragging.enable();
    });



// 	let sliderControl = L.control.sliderControl({
// 		position: "bottomleft",
// 		minValue: 2014,
// 		maxValue: 2020

// 		// layer: mylayer
// 	});

// 	vis.map.addControl(sliderControl);

// 	sliderControl.startSlider();
}


