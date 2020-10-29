
// ======== GLOBALS ======== //
let phoneBrowsing = false;

// Min width that browser window must be before switching to phoneBrowsing mode (even on Desktop, it will display everything as if on Mobile)
const phoneBrowsingCutoff = 1100;

// Datasets
let geoData = null;
let zillowData = null;

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
        const rangeLabel = document.getElementById(`${sliderID}-slider-label`);

        if (sliderID === "min-donor-threshold-network") {
            rangeLabel.innerHTML = `<span>${d3.format(",")(sliderVal)}</span>`;
        }
        else {
            rangeLabel.innerHTML = `<span>${sliderVal}%</span>`;
        }

        const newVal = Number(((sliderVal - range.min) * 100) / (range.max - range.min));
        rangeLabel.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    };

    $("#min-overlap-threshold").on('input', () => {
        const range = document.getElementById('min-overlap-threshold');

        overlapThreshold = range.value;
        nodeLink.wrangleData();

        updateSliderLabel("min-overlap-threshold", overlapThreshold);
    });

    $("#min-overlap-network").on('input', () => {
        const range = document.getElementById('min-overlap-network');

        overlapThresholdNewtork = range.value;
        networkChart.wrangleData();

        updateSliderLabel("min-overlap-network", overlapThresholdNewtork);
    });


    $("#min-donor-threshold-network").on('input', () => {
        const range = document.getElementById('min-donor-threshold-network');

        minDonorCountNetwork = range.value;
        networkChart.wrangleData();

        updateSliderLabel("min-donor-threshold-network", minDonorCountNetwork);
    });

    updateSliderLabel("min-overlap-threshold", overlapThreshold);
    updateSliderLabel("min-overlap-network", overlapThresholdNewtork);
    updateSliderLabel("min-donor-threshold-network", minDonorCountNetwork);
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

        $("#intro-wrapper, #map-wrapper")
            .css("visibility", "visible");

        evictionMap = new NeighborhoodMap("#map-area");
        // initSliders();
    });
}

main();






