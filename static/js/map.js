// d3 = require("d3@5");

NeighborhoodMap = function(_parentElement, _mapType) {
    this.parentElement = _parentElement;
    this.mapType = _mapType;

    this.initVis();
};


NeighborhoodMap.prototype.initVis = function() {
    const vis = this;

    // Set height/width of viewBox
    vis.width = 1200;
    vis.height = 800;

    if (phoneBrowsing === true) {
        vis.width = 800;
        vis.height = 800;
    }

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width, vis.height]);

    vis.color = d3.scaleLinear()
        .range(['#FFE4B2', 'orange']);

    vis.projection = d3.geoAlbersUsa()
        .fitExtent([[20, 20], [vis.width-20, vis.height-20]], geoData);

    vis.path = d3.geoPath()
        .projection(vis.projection);


    // Initialize hover tooltip on nodes
    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        // .offset([-15, 0])
        .html((d) => {

            let outputString = '<div>';
            outputString += `<div style="text-align: center;"><span><strong>${d.properties.SPA_NAME}</strong></span></div><br>`;

            if (vis.mapType === "compare") {
                let housingValueChange = (typeof d.properties.housing_value_changes[currentYear] === "undefined" || d.properties.housing_value_changes[currentYear] === "") ? "N/A" : d3.format("+0.1%")(d.properties.housing_value_changes[currentYear]);
                outputString += `<span>Change in Home Value (${currentYear-1}-${currentYear-2000}): </span> <span style="float: right;">${housingValueChange}</span><br>`;
            }
            else {
                outputString += `<span>Population: </span> <span style="float: right;">${d3.format(",")(d.properties.pop)}</span><br>`;
                outputString += `<span>Households: </span> <span style="float: right;">${d3.format(",")(d.properties.total_HH)}</span><br>`;
                outputString += `<span>Eviction Filings (${currentYear}): </span> <span style="float: right;">${d.properties.eviction_filings[currentYear]}</span><br>`;
                outputString += `<span>Per 1,000 Households: </span> <span style="float: right;">${d3.format("0.1f")(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH)}</span><br>`;
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

NeighborhoodMap.prototype.wrangleData = function() {
    const vis = this;

    vis.updateVis();
};

NeighborhoodMap.prototype.updateVis = function() {
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
        vis.mapProperty = 'eviction_filings';

        vis.color
            .domain([d3.min(geoData.features, d => d.properties[vis.mapProperty][currentYear] / d.properties.total_HH), 
                0.6*d3.max(geoData.features, d => d.properties[vis.mapProperty][currentYear] / d.properties.total_HH)]);
    }

    console.log(vis.mapType)

    vis.mapPath = vis.mapPath
        .data( geoData.features, (d) => d.properties.SPA_NAME)
        .join(
            enter => enter.append("path")
                .attr("d", vis.path)
                .attr("class", d => d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                .style("opacity", 0.8)
                .style("stroke","black")
                .style('stroke-width', 0.5)
                .style("fill", d => {
                    let propertyVal = (vis.mapProperty === "housing_value_changes" || vis.mapProperty === "eviction_filings") ? d.properties[vis.mapProperty][currentYear] : d.properties[vis.mapProperty];

                    if (propertyVal === "" || typeof propertyVal === "undefined") {
                        return "#DCDCDC";
                    }
                    else if (vis.mapProperty === "eviction_filings") {
                        return vis.color(propertyVal / d.properties.total_HH);
                    }
                    else {
                        return vis.color(propertyVal);
                    }
                })
                .on('mouseover', (d,i,n) => {
                    let evictionNode = evictionMap.svg.select('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-")).node();
                    evictionMap.tip.show(d, evictionNode);

                    let compareNode = compareMap.svg.select('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-")).node();
                    compareMap.tip.show(d,compareNode);

                    d3.selectAll('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                        .style("opacity", 1)
                        .style("stroke","black")
                        .style("stroke-width", 3.0);
                })
                .on('mouseout', d => {
                    evictionMap.tip.hide();
                    compareMap.tip.hide();

                    d3.selectAll('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                        .style("opacity", 0.8)
                        .style("stroke","black")
                        .style("stroke-width", 0.5);
                }),

            update => update
                .transition()
                .duration(300)
                .style("fill", d => {
                    let propertyVal = (vis.mapProperty === "housing_value_changes" || vis.mapProperty === "eviction_filings") ? d.properties[vis.mapProperty][currentYear] : d.properties[vis.mapProperty];

                    if (propertyVal === "" || typeof propertyVal === "undefined") {
                        return "#DCDCDC";
                    }
                    else if (vis.mapProperty === "eviction_filings") {
                        return vis.color(propertyVal / d.properties.total_HH);
                    }
                    else {
                        return vis.color(propertyVal);
                    }
                }),

            exit => exit.remove()
            );

};
