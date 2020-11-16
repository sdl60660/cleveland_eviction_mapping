
LineChart = function(_parentElement, _mapType) {
    this.parentElement = _parentElement;

    this.initVis();
};


LineChart.prototype.initVis = function() {
    const vis = this;

    // Set height/width of viewBox
    vis.margin = {top: 20, right: 15, bottom: 45, left: 40};
    vis.width = 800 - vis.margin.left - vis.margin.right;
    vis.height = 260 - vis.margin.top - vis.margin.bottom;

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width+vis.margin.left+vis.margin.right, vis.height+vis.margin.top+vis.margin.bottom]);

    vis.x = d3.scaleLinear()
    	// .domain([new Date("01/01/2011"), new Date("12/31/2020")])
    	.domain([2011, 2020])
    	.range([0, vis.width])

	vis.y = d3.scaleLinear()
		.range([vis.height, 0]);

	vis.line = d3.line()
    	.x((d) => vis.x(d.year))
    	.y((d) => vis.y(d.filing_count));

	vis.g = vis.svg.append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	// Initialize hover tooltip on nodes
    vis.tip = d3.tip()
        .attr("class", "d3-tip")
        .direction("s")
        .offset([10, 0])
        .html((d) => {

            let outputString = '<table><tbody>';
            // outputString += `<div style="text-align: center;"><span><strong>${d.properties.SPA_NAME}</strong></span></div><br>`;
            outputString += `<tr><td>Year: </td><td style="padding-left: 10px; float: right;">${d.year}</td></tr><br>`;
            outputString += `<tr><td>Eviction Filings:</td><td style="padding-left: 10px; float: right;">${d3.format(",")(d.filing_count)}</td></tr>`;

            outputString += '</tbody></table>';

            return outputString
        });

    vis.svg.call(vis.tip);

    vis.yAxis = vis.g.append("g")
	    .attr("class", "y axis")
	    // .attr("transform", "translate(" + vis.margin.left + ",0)")

	vis.xAxis = vis.g.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + vis.height + ")")
	    // .attr("transform", "translate(" + vis.margin.left + "," + (vis.height) + ")")

	vis.linePath = vis.g
		.selectAll(".line");

	vis.points = vis.g
		.selectAll(".dot");

	vis.xAxisLabel = vis.g.append("text")
        .attr("transform", `translate(${vis.width / 2}, ${vis.height + 42})`)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .style("font-size", "15px")
        .style("font-family", "aktiv-grotesk")
        .text("");


    vis.wrangleData();
}


LineChart.prototype.wrangleData = function() {
    const vis = this;

    vis.chartNeighborhood = featuredNeighborhood === null ? "Cleveland" : featuredNeighborhood;

    vis.data = yearlyCountMap
    	.filter(d => d[0] === vis.chartNeighborhood)[0][1]
    	.map(d => { 
    		return {'neighborhood': vis.chartNeighborhood, 'year': d[0], 'filing_count': d[1]}
    	})
    	.sort((a,b) => a.year - b.year);
    
    vis.updateVis();
}


LineChart.prototype.updateVis = function() {
    const vis = this;

    vis.y
    	.domain([0, Math.ceil(1.2*d3.max(vis.data, d => d.filing_count)/10)*10]);

	vis.xAxis
		.transition()
		.duration(500)
		    .call(d3.axisBottom(vis.x)
		    	.tickFormat(d3.format("d")));

	vis.yAxis
		.transition()
		.duration(500)
	    	.call(d3.axisLeft(vis.y)
	    		.ticks(5));

	vis.linePath = vis.linePath
	    .data([vis.data], (d,i) => i)
	    .join(
	    	enter => enter.append("path")
			    .attr("class", "line")
			    .attr("fill", "none")
		      	.attr("stroke", "#69b3a2")
		      	.attr("stroke-width", 4)
			    .attr("d", vis.line),

			update => update
				.transition()
				.attr("d", vis.line),

			exit => exit.remove()
		);

	vis.points = vis.points
	    // .data(vis.data, d => `${d.neighborhood}-${d.year}`)
	    .data(vis.data, (d,i) => i)
	    .join(
	    	enter => enter.append("circle")
	    		.attr("class", "dot")
	    		.style("fill", "#69b3a2")
	    		.attr("cx", (d, i) => vis.x(d.year))
	    		.attr("cy", (d) => vis.y(d.filing_count))
	    		.attr("r", 5)
	    		.on("mouseover", vis.tip.show)
	    		.on("mouseout", vis.tip.hide),

    		update => update
    			.transition()
		    		.attr("cx", (d, i) => vis.x(d.year))
		    		.attr("cy", (d) => vis.y(d.filing_count)),

	    	exit => exit.remove()
	    );

	vis.xAxisLabel
		.text(`Eviction Filings Over Time in ${vis.chartNeighborhood}`);

}
