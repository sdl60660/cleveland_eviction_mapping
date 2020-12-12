
// ======== GLOBALS ======== //
let phoneBrowsing = false;

// Min width that browser window must be before switching to phoneBrowsing mode (even on Desktop, it will display everything as if on Mobile)
const phoneBrowsingCutoff = 1100;

// Datasets
let geoData = null;
let zillowData = null;
let allEvictions = null;
let monthlyCountMap = null;

// Init Data
let currentYear = 2019;
let includeCMHA = true;

let featuredNeighborhood = null;

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

    const updateSliderLabel = (sliderID, labelID, sliderVal) => {
        const range = document.getElementById(sliderID);
        const rangeLabel = document.getElementById(labelID);

        rangeLabel.innerHTML = `<span>${sliderVal}</span>`;

        const newVal = Number((sliderVal - range.min) * 100 / (range.max - range.min));
        rangeLabel.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    };

    $("#year-slider, #map-year-slider").on('input', (event) => {
        currentYear = event.target.value;

        evictionMap.wrangleData();
        compareMap.wrangleData();

        if (featuredNeighborhood !== null) {
            neighborhoodMap.plotNeighborhoodEvictions(featuredNeighborhood, currentYear);
        }

        updateSliderLabel("year-slider", "year-slider-label", currentYear);
        updateSliderLabel("map-year-slider", "map-year-slider-label", currentYear);

        let otherID = event.target.id === "year-slider" ? "map-year-slider" : "year-slider";
        document.getElementById(otherID).value = event.target.value;
    });

    updateSliderLabel("year-slider", "year-slider-label", currentYear);
    updateSliderLabel("map-year-slider", "map-year-slider-label", currentYear);
}


function main() {

    // Begin loading datafiles
    const promises = [
        d3.json("static/data/cleveland_neighborhoods.geojson"),
        d3.csv("static/data/cleveland_neighborhood_home_values.csv"),
        d3.csv("static/data/geocoded_eviction_data_with_neighborhoods.csv")
    ];

    determinePhoneBrowsing();
    
    Promise.all(promises).then(function(allData) {

        geoData = allData[0];
        zillowData = allData[1];
        allEvictions = allData[2];

        allEvictions.forEach(d => {
            let date = new Date(d['File Date'])
            d.year = +date.getFullYear();
        })

        yearlyCountMap = d3.rollups(allEvictions, 
            v => v.length, 
            d => d.SPA_NAME, 
            d => {
                let date = new Date(d['File Date'])
                // let month = parseInt(date.getMonth())+1
                // return `${ String("00" + month).slice(-2) }/01/${date.getFullYear()}`
                return date.getFullYear()
            });

        fullCityRollup = d3.rollups(allEvictions,
            v => v.length,
            d => {
                let date = new Date(d['File Date'])
                // let month = parseInt(date.getMonth())+1
                // return `${ String("00" + month).slice(-2) }/01/${date.getFullYear()}`
                return date.getFullYear()
            });

        yearlyCountMap.push(["Cleveland", fullCityRollup])

        console.log(yearlyCountMap);


        $(".loadring-container")
            .hide();

        $("#intro-wrapper, #map-wrapper, #bubbleplot-wrapper, #neighborhood-map-wrapper, .footer")
            .css("visibility", "visible");

        evictionMap = new CityMap("#eviction-map-area", "evictions");
        compareMap = new CityMap("#compare-map-area", "compare");

        // bubblePlot = new BubblePlot("#bubbleplot-area");

        neighborhoodMap = new NeighborhoodMap("neighborhood-map-area");
        timelineChart = new LineChart("#timeline-area");

        initSliders();

        $("#feature-select")
            .on("change", () => {
                compareMap.wrangleData();

                // bubblePlot.wrangleData();
            })

        $('#cmha-evictions')
            .on('click', () => {
                includeCMHA = $('#cmha-evictions').is(":checked");
                evictionMap.wrangleData();
            });
    });
}

main();






