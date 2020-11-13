LineChart = function(_parentElement, _mapType) {
    this.parentElement = _parentElement;

    this.initVis();
};


LineChart.prototype.initVis = function() {
    const vis = this;

    // Set height/width of viewBox
    vis.margin = {top: 20, right: 30, bottom: 20, left: 40};
    vis.width = 1000 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width+vis.margin.left+vis.margin.right, vis.height+vis.margin.top+vis.margin.bottom]);

    vis.x = d3.scaleTime()
    	.domain([new Date("01/01/2013"), new Date("12/31/2020")])
    	.range([0, vis.width])
	vis.y = d3.scaleLinear()
		.range([vis.height, 0]);

	vis.line = d3.line()
    	.x((d) => vis.x(d.month))
    	.y((d) => vis.y(d.filing_count));

	vis.g = vis.svg.append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    vis.wrangleData();
}


LineChart.prototype.wrangleData = function() {
    const vis = this;

    let neighborhoodName = "Downtown";
    vis.data = monthlyCountMap
    	.filter(d => d[0] === neighborhoodName)[0][1]
    	.map(d => { 
    		return {'neighborhood': neighborhoodName, 'month': new Date(d[0]), 'filing_count': d[1]}
    	})
    	.sort((a,b) => a.month - b.month);
    
    // console.log(vis.data);

    vis.updateVis();
}


LineChart.prototype.updateVis = function() {
    const vis = this;

    vis.y
    	.domain([0, Math.ceil(1.2*d3.max(vis.data, d => d.filing_count)/10)*10]);

	vis.xAxis = vis.svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + (vis.height - vis.margin.bottom) + ")")
	    .call(d3.axisBottom(vis.x));

	vis.yAxis = vis.svg.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(" + vis.margin.left + ",0)")
	    .call(d3.axisLeft(vis.y));

	vis.linePath = vis.g.append("path")
	    .datum(vis.data)
	    .attr("class", "line")
	    .attr("fill", "none")
      	.attr("stroke", "#69b3a2")
      	.attr("stroke-width", 4)
	    .attr("d", vis.line);

	vis.points = vis.g.selectAll(".dot")
	    .data(vis.data, d => `${d.neighborhoodName}-${d.month}`)
	    .join(
	    	enter => enter.append("circle")
	    		.attr("class", "dot")
	    		.attr("cx", (d, i) => vis.x(d.month))
	    		.attr("cy", (d) => vis.y(d.filing_count))
	    		.attr("r", 5),

    		update => update
	    		.attr("cx", (d, i) => vis.x(d.month))
	    		.attr("cy", (d) => vis.y(d.filing_count))
	    		.attr("r", 5),

	    	exit => exit.remove()
	    );

}
