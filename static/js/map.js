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
        vis.width = 1200;
        vis.height = 1800;
    }

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width, vis.height]);


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


    vis.wrangleData();
};

NeighborhoodMap.prototype.wrangleData = function() {
    const vis = this;

    vis.updateVis();

};

NeighborhoodMap.prototype.updateVis = function() {
    const vis = this;

};
