// d3 = require("d3@5");

NeighborhoodMap = function(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
};


NeighborhoodMap.prototype.initVis = function() {
    const vis = this;

    // Set height/width of viewBox
    vis.width = 1800;
    vis.height = 1200;

    if (phoneBrowsing === true) {
        vis.width = 1800;
        vis.height = 1200;
    }

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width, vis.height]);

    vis.g = vis.svg
        .append('g')
            .attr('class', 'map');

    vis.color = d3.scaleLog()
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
        .html(function(d) {
            let outputString = '<div>';
            // outputString += `<div style="text-align: center;"><span><strong>${d.display_name}</strong></span></div><br>`;
            // outputString += `<span>Known Donors: </span> <span style="float: right;">${d3.format(",")(d.total_donors)}</span><br>`;

            outputString += '</div>';

            return outputString
        });
    vis.svg.call(vis.tip);


    vis.color
        .domain(d3.extent(geoData.features, d => d.properties.eviction_filings["2018"] / d.properties.population));


    vis.mapPath = vis.g.append("g")
        .attr("class", "neighborhood-path")
        .selectAll("path")
        .data( geoData.features, d => d.properties.SPA_NAME)
        .join(
            enter => enter.append("path")
                .attr("d", vis.path)
                .attr("class", d => d.properties.SPA_NAME.replace(/ /g, '-'))
                .attr("default-stroke", 0.3)
                .style("opacity", 0.8)
                .style("stroke","black")
                .style('stroke-width', 0.3)
                .style("fill", d => vis.color(d.properties.eviction_filings["2018"] / d.properties.population)),

            exit => exit.remove()
            );




    vis.wrangleData();
};

NeighborhoodMap.prototype.wrangleData = function() {
    const vis = this;

    vis.updateVis();

};

NeighborhoodMap.prototype.updateVis = function() {
    const vis = this;

};
