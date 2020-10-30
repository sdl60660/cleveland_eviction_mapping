
// ======== GLOBALS ======== //
let phoneBrowsing = false;

// Min width that browser window must be before switching to phoneBrowsing mode (even on Desktop, it will display everything as if on Mobile)
const phoneBrowsingCutoff = 1100;

// Datasets
let geoData = null;
let zillowData = null;

// Init Data
let currentYear = 2019;

// ======== END GLOBALS ======== //

// Determine whether to enter phoneBrowsing mode based on browser window width or browser type (uses phoneBrowsingCutoff as threshold of window width)
// Then, execute a lot of code/formatting that depends on whether the user is on Mobile or Desktop
function determinePhoneBrowsing() {
    // Determine if the user is browsing on mobile based on browser window width or browser type
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < phoneBrowsingCutoff) {
        phoneBrowsing = true;
    }

    //
    if (phoneBrowsing === true) {
        $(".step")
            .css("font-size", "18pt");

        $(".step .body")
            .css("font-size", "18pt");
    }

    // On mobile, fade non-current annotation slides to 0, because they are all fixed at the top and overlapping
    // On desktop keep them visible, but low opacity
    if (phoneBrowsing === true) {
        hiddenOpacity = 0.0;
    }
    else {
        hiddenOpacity = 0.2;
    }

    // If mobile, and annotations are up top, adjust top-padding on viz-tiles to make room for fixed-position annotation
    if (phoneBrowsing === true) {
        // setDynamicPadding('#sunburst-tile', 1, 7);       // Keep this, but populate with correct element ID and indices
        // setDynamicPadding('#flowchart-tile', 8, 13);     // Keep this, but populate with correct element ID and indices
    }
}


// Initialize timeline slider
function initSliders() {

    const updateSliderLabel = (sliderID, sliderVal) => {
        const range = document.getElementById(sliderID);
        const rangeLabel = document.getElementById(`year-slider-label`);

        rangeLabel.innerHTML = `<span>${sliderVal}</span>`;

        const newVal = Number((sliderVal - range.min) * 100 / (range.max - range.min));
        rangeLabel.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    };

    $("#year-slider").on('input', () => {
        const range = document.getElementById('year-slider');

        currentYear = range.value;

        evictionMap.wrangleData();
        housingValueMap.wrangleData();

        updateSliderLabel("year-slider", currentYear);
    });

    updateSliderLabel("year-slider", currentYear);
}


function main() {

    // Begin loading datafiles
    const promises = [
        d3.json("static/data/cleveland_neighborhoods.geojson"),
        d3.csv("static/data/cleveland_neighborhood_home_values.csv")
    ];

    determinePhoneBrowsing();
    
    Promise.all(promises).then(function(allData) {

        geoData = allData[0];
        zillowData = allData[1];

        $(".loadring-container")
            .hide();

        $("#intro-wrapper, #map-wrapper, .footer")
            .css("visibility", "visible");

        evictionMap = new NeighborhoodMap("#eviction-map-area", "evictions");
        housingValueMap = new NeighborhoodMap("#housing-value-map-area", "property_values");
        
        initSliders();
    });
}

main();






