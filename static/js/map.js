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

    vis.g = vis.svg
        .append('g')
            .attr('class', 'map');

    vis.color = d3.scaleLinear()
        .range(['#FFE4B2', 'orange']);

    vis.projection = d3.geoAlbersUsa()
        // .center([-81.6944, 41.4993])
        // .scale(1000)
        .fitExtent([[20, 20], [vis.width-20, vis.height-20]], geoData);

    // vis.projection
        // .translate([(vis.width / 2) + 10, (vis.height / 2)]);

    vis.path = d3.geoPath().projection(vis.projection);


    // Initialize hover tooltip on nodes
    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        // .offset([-15, 0])
        .html((d) => {

            let outputString = '<div>';
            outputString += `<div style="text-align: center;"><span><strong>${d.properties.SPA_NAME}</strong></span></div><br>`;
            outputString += `<span>Population: </span> <span style="float: right;">${d3.format(",")(d.properties.population)}</span><br>`;
            outputString += `<span>Eviction Filings (${currentYear}): </span> <span style="float: right;">${d.properties.eviction_filings[currentYear]}</span><br>`;
            outputString += `<span>Per 1,000 Residents: </span> <span style="float: right;">${d3.format("0.1f")(1000*d.properties.eviction_filings[currentYear] / d.properties.population)}</span><br>`;


            outputString += '</div>';

            return outputString
        });
    vis.svg.call(vis.tip);

    vis.mapPath = vis.g.append("g")
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

    vis.color
        .domain(d3.extent(geoData.features, d => d.properties.eviction_filings[currentYear] / d.properties.population));

    vis.mapPath = vis.mapPath
        .data( geoData.features, (d) => d.properties.SPA_NAME)
        .join(
            enter => enter.append("path")
                .attr("d", vis.path)
                .attr("class", d => d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                .style("opacity", 0.8)
                .style("stroke","black")
                .style('stroke-width', 0.5)
                .style("fill", d => (typeof d.properties.eviction_filings[currentYear] === "undefined" || typeof d.properties.population === "undefined") ? "#DCDCDC" : vis.color(d.properties.eviction_filings[currentYear] / d.properties.population))
                .on('mouseover', d => {
                    vis.tip.show(d);

                    console.log(d.properties.SPA_NAME.replace(/ /g, '-'));

                    d3.selectAll('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                        .style("opacity", 1)
                        .style("stroke","black")
                        .style("stroke-width", 3.0);
                })
                .on('mouseout', d => {
                    vis.tip.hide(d);

                    d3.selectAll('.' + d.properties.SPA_NAME.replace(/ /g, '-').replace('.', '-').replace("'", "-"))
                        .style("opacity", 0.8)
                        .style("stroke","black")
                        .style("stroke-width", 0.5);
                }),

            update => update
                .transition()
                .duration(200)
                .style("fill", d => (typeof d.properties.eviction_filings[currentYear] === "undefined" || typeof d.properties.population === "undefined") ? "#DCDCDC" : vis.color(d.properties.eviction_filings[currentYear] / d.properties.population)),

            exit => exit.remove()
            );

};
