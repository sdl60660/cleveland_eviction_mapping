// d3 = require("d3@5");
// d3 = require("d3@6");
// import d3_colorLegend from "https://api.observablehq.com/@d3/color-legend.js?v=3";

CityMap = function(_parentElement, _mapType) {
    this.parentElement = _parentElement;
    this.mapType = _mapType;

    this.initVis();
};


CityMap.prototype.initVis = function() {
    const vis = this;

    // Set height/width of viewBox
    vis.width = 1000;
    vis.height = 800;

    if (phoneBrowsing === true) {
        vis.width = 800;
        vis.height = 800;
    }

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width, vis.height]);

    vis.orangeColorScalar = 0.6;
    vis.color = d3.scaleLinear()
        .range(['#FFE4B2', 'orange']);

    vis.projection = d3.geoAlbersUsa()
        .fitExtent([[20, 20], [vis.width-20, vis.height-20]], geoData);

    vis.path = d3.geoPath()
        .projection(vis.projection);

    vis.eviction_field = includeCMHA === true ? "eviction_filings" : "filtered_eviction_filings";

    // Initialize hover tooltip on nodes
    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        // .offset([-15, 0])
        .html((d) => {

            let outputString = '<div>';
            outputString += `<div style="text-align: center;"><span><strong>${d.properties.SPA_NAME}</strong></span></div><br>`;

            let selectVal = $('#feature-select :selected').val();
            let selectText = $('#feature-select :selected').text();

            if (vis.mapType === "evictions") {
                let evictionCount = typeof d.properties[vis.eviction_field][currentYear] === "undefined" ? 0 : d.properties[vis.eviction_field][currentYear]

                // outputString += `<span>Population: </span> <span style="float: right;">${d3.format(",")(d.properties.pop)}</span><br>`;
                outputString += `<span>Total Renter Households: </span> <span style="float: right;">${d3.format(",")(d.properties.renters)}</span><br>`;
                outputString += `<span>Eviction Filings (${currentYear}): </span> <span style="float: right;">${evictionCount}</span><br>`;
                outputString += `<span>Per 1,000 Renter Households: </span> <span style="float: right;">${d3.format("0.1f")(1000*evictionCount / d.properties.renters)}</span><br>`;
            }
            else if (selectVal === "housing_value_changes") {
                let housingValueChange = (typeof d.properties.housing_value_changes[currentYear] === "undefined" || d.properties.housing_value_changes[currentYear] === "") ? "N/A" : d3.format("+0.1%")(d.properties.housing_value_changes[currentYear]);
                outputString += `<span>Change in Home Value (${currentYear-1}-${currentYear-2000}): </span> <span style="float: right;">${housingValueChange}</span><br>`;
            }
            else {
                let displayVal = (typeof d.properties[selectVal] === "undefined" || d.properties[selectVal] === "") ? "N/A" : d.properties[selectVal];

                displayVal = selectText.includes("%") ? d3.format("0.1%")(displayVal) : d3.format("$,.0f")(displayVal);

                outputString += `<span>${selectText}: </span> <span style="float: right;">${displayVal}</span><br>`;
            }



            outputString += '</div>';

            return outputString
        });
    vis.svg.call(vis.tip);

    vis.mapPath = vis.svg.append("g")
        .attr("class", "neighborhood-path")
        .selectAll("path");

    vis.wrangleData();
};

CityMap.prototype.wrangleData = function() {
    const vis = this;

    vis.eviction_field = includeCMHA === true ? "eviction_filings" : "filtered_eviction_filings";

    vis.updateVis();
};

CityMap.prototype.updateVis = function() {
    const vis = this;

    if (vis.mapType === "compare") {
        vis.mapProperty = $('#feature-select :selected').val();

        if (vis.mapProperty === "housing_value_changes") {
            vis.color
                .domain([d3.min(geoData.features, d => d.properties[vis.mapProperty][currentYear]), 0, d3.max(geoData.features, d => d.properties[vis.mapProperty][currentYear])])
                .range(["#762a83", "#f7f7f7", "#1b7837"]);
                // .domain(d3.extent(geoData.features, d => d.properties[vis.mapProperty][currentYear]))
                // .range(["#f7f7f7", "#1b7837"]);
        }
        else {
            vis.color
                .domain(d3.extent(geoData.features, d => d.properties[vis.mapProperty]))
                .range(["#f7f7f7", "#1b7837"]);
        }
    }
    else {
        vis.mapProperty = vis.eviction_field;

        vis.color
            .domain([1000*d3.min(geoData.features, d => d.properties[vis.mapProperty][currentYear] / d.properties.renters), 
                vis.orangeColorScalar*1000*d3.max(geoData.features, d => d.properties[vis.mapProperty][currentYear] / d.properties.renters)]);
    }

    vis.mapPath = vis.mapPath
        .data( geoData.features, (d) => d.properties.SPA_NAME)
        .join(
            enter => enter.append("path")
                .attr("d", vis.path)
                .attr("class", d => d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                .attr("truePropertyVal", (d) => {
                    let propertyVal = (vis.mapProperty === "housing_value_changes" || vis.mapProperty === vis.eviction_field) ? d.properties[vis.mapProperty][currentYear] : d.properties[vis.mapProperty];

                    if (propertyVal === "" || typeof propertyVal === "undefined") {
                        return undefined;
                    }
                    else if (vis.mapProperty === vis.eviction_field) {
                        return 1000*propertyVal / d.properties.renters;
                    }
                    else {
                        return propertyVal;
                    }
                })
                .style("opacity", 0.8)
                .style("stroke","black")
                .style('stroke-width', 0.5)
                .style("fill", d => {
                    let propertyVal = (vis.mapProperty === "housing_value_changes" || vis.mapProperty === vis.eviction_field) ? d.properties[vis.mapProperty][currentYear] : d.properties[vis.mapProperty];

                    if (propertyVal === "" || typeof propertyVal === "undefined") {
                        return "url(#diagonal-stripe-1)";
                    }
                    else if (vis.mapProperty === vis.eviction_field) {
                        return vis.color(1000*propertyVal / d.properties.renters);
                    }
                    else {
                        return vis.color(propertyVal);
                    }
                })
                .on('click', (d) => {
                    neighborhoodMap.zoomToNeighborhood(d.properties.SPA_NAME);
                })
                .on('mouseover', (d,i,n) => {
                    let truePropertyVal = $(n[i]).attr("truePropertyVal");

                    let evictionNode = evictionMap.svg.select('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-")).node();
                    evictionMap.tip.show(d, evictionNode);

                    let compareNode = compareMap.svg.select('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-")).node();
                    compareMap.tip.show(d, compareNode);

                    d3.selectAll('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                        .style("opacity", 1)
                        .style("stroke","black")
                        .style("stroke-width", 3.0);

                    let evictionPropertyVal = $(evictionNode).attr("truePropertyVal");
                    let comparePropertyVal = $(compareNode).attr("truePropertyVal");

                    if (typeof evictionPropertyVal !== "undefined") {
                        evictionMap.legendSVG.select(".legend-current-value-arrow")
                            .attr("x", evictionMap.legendAxisScale(evictionPropertyVal))
                            .style("opacity", 1.0);
                    }

                    if (typeof comparePropertyVal !== "undefined") {
                        compareMap.legendSVG.select(".legend-current-value-arrow")
                            .attr("x", compareMap.legendAxisScale(comparePropertyVal))
                            .style("opacity", 1.0);
                    }

                })
                .on('mouseout', d => {
                    evictionMap.tip.hide();
                    compareMap.tip.hide();

                    d3.selectAll('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                        .style("opacity", 0.8)
                        .style("stroke","black")
                        .style("stroke-width", 0.5);

                    d3.selectAll(".legend-current-value-arrow")
                        .style("opacity", 0.0);
                }),

            update => update
                .transition()
                .duration(300)
                .attr("truePropertyVal", (d) => {
                    let propertyVal = (vis.mapProperty === "housing_value_changes" || vis.mapProperty === vis.eviction_field) ? d.properties[vis.mapProperty][currentYear] : d.properties[vis.mapProperty];

                    if (propertyVal === "" || typeof propertyVal === "undefined") {
                        return undefined;
                    }
                    else if (vis.mapProperty === vis.eviction_field) {
                        return 1000*propertyVal / d.properties.renters;
                    }
                    else {
                        return propertyVal;
                    }
                })
                .style("fill", d => {
                    let propertyVal = (vis.mapProperty === "housing_value_changes" || vis.mapProperty === vis.eviction_field) ? d.properties[vis.mapProperty][currentYear] : d.properties[vis.mapProperty];

                    if (propertyVal === "" || typeof propertyVal === "undefined") {
                        return "url(#diagonal-stripe-1)";
                    }
                    else if (vis.mapProperty === vis.eviction_field) {
                        return vis.color(1000*propertyVal / d.properties.renters);
                    }
                    else {
                        return vis.color(propertyVal);
                    }
                }),

            exit => exit.remove()

            );

    vis.createLegend();

};


CityMap.prototype.createLegend = function() {
    const vis = this;

    d3.select(`#legend-${vis.mapType}`)
        .remove();

    let margin = ({top: 20, right: 55, bottom: 30, left: 50});

    let barHeight = 20;
    let height = 100;
    let width = phoneBrowsing === true ? 375 : 450;

    let colorScale = vis.color;
    if (vis.mapType === "compare") {
        colorScale.domain(vis.color.domain());
        vis.legendSVGid = "#compare-map-legend";
    }
    else {
        colorScale.domain([vis.color.domain()[0], vis.color.domain()[1]/vis.orangeColorScalar]);
        vis.legendSVGid = "#eviction-map-legend";
    }

    vis.legendSVG = d3.select(vis.legendSVGid)
        .append("svg")
        .attr("id", `legend-${vis.mapType}`)
        .attr("width", width)
    const defs = vis.legendSVG.append("defs");
  
    vis.linearGradient = defs.append("linearGradient")
        .attr("id", `linear-gradient-${vis.mapType}`);


    vis.linearGradient.selectAll("stop")
        .data(colorScale.ticks().map((t, i, n) => {
            return vis.mapType === "compare" ? { offset: `${100*i/n.length}%`, color: colorScale(t) } : { offset: `${100*i/n.length}%`, color: colorScale(t/vis.orangeColorScalar) };
        }))
        .enter()
            .append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

    let selectVal = $('#feature-select :selected').val();
    let selectText = $('#feature-select :selected').text();

    vis.legendSVG.append('g')
        .attr("transform", `translate(0,${height - margin.bottom - barHeight})`)
        .append("rect")
            .attr('transform', `translate(${margin.left}, 0)`)
            .attr("width", width - margin.right - margin.left)
            .attr("height", barHeight)
            .style("fill", `url(#linear-gradient-${vis.mapType})`);

    // Legend min val text
    vis.legendSVG.append("text")
        .attr("class", "legend-min-val")
        .attr("x", margin.left - 3)
        .attr("y", height - margin.bottom - barHeight/2 + 6)
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .text(() => {
            if (vis.mapType === "evictions") {
                return d3.format("0.1f")(colorScale.domain()[0]);
            }
            else if (selectVal === "housing_value_changes") {
                return d3.format("+0.1%")(colorScale.domain()[0]);
            }
            else if (selectText.includes("%")) {
                return d3.format("0.1%")(colorScale.domain()[0]);
            }
            else {
                return d3.format("$,")(colorScale.domain()[0]);
            }
        });

    // Legend max val text
    vis.legendSVG.append("text")
        .attr("class", "legend-max-val")
        .attr("x", (width - margin.right) + 3)
        .attr("y", height - margin.bottom - barHeight/2 + 6)
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .text(() => {
            if (vis.mapType === "evictions") {
                return d3.format("0.1f")(colorScale.domain()[1]);
            }
            else if (selectVal === "housing_value_changes") {
                return d3.format("+0.1%")(colorScale.domain()[2]);
            }
            else if (selectText.includes("%")) {
                return d3.format("0.1%")(colorScale.domain()[1]);
            }
            else {
                return d3.format("$,")(colorScale.domain()[1]);
            }
        });

    // Legend label
    vis.legendSVG.append("text")
        .attr("class", "legend-label")
        .attr("transform", `translate(${width/2},${height - barHeight + 3})`)
        .attr("text-anchor", "middle")
        .text(() => vis.mapType === "evictions" ? 
            `Evictions per 1,000 Renter Households (${currentYear})`
            : selectVal === "housing_value_changes" ? `Change in Home Value (${currentYear-1}-${currentYear-2000})` : selectText);


    let axisDomain = colorScale.domain().length === 3 ? [colorScale.domain()[0], colorScale.domain()[2]] : [colorScale.domain()[0], colorScale.domain()[1]];
    vis.legendAxisScale = d3.scaleLinear()
        .domain(axisDomain)
        .range([margin.left, width - margin.right]);


    // Legend current value arrow
    vis.legendSVG.append("text")
        .attr("class", "legend-current-value-arrow")
        .style("font-size", "24px")
        .attr("y", height - margin.bottom - barHeight)
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .style("opacity", 0.0)
        .text("▾");


    // let axisBottom = g => g
    //     .attr("class", `x-axis`)
    //     .attr("transform", `translate(0,${margin.bottom - barHeight/2})`)
    //     .call(d3.axisBottom(axisScale)
    //         .ticks(0)
    //         .tickSize(-barHeight));

    // vis.legendSVG.append('g')
    //     .call(axisBottom);

};






