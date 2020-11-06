

BubblePlot = function(_parentElement) {
    this.parentElement = _parentElement;

    this.initVis();
};

BubblePlot.prototype.initVis = function() {
    const vis = this;

    vis.margin = {top: 50, right: 50, bottom: 60, left: 60};

    // Set height/width of viewBox
    vis.width = 900 - vis.margin.left - vis.margin.right;
    vis.height = 900 - vis.margin.top - vis.margin.bottom;

    vis.defaultBubbleOpacity = 0.72;

    // Initialize SVG
    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("viewBox", [0, 0, vis.width+vis.margin.left+vis.margin.right, vis.height+vis.margin.top+vis.margin.bottom]);

    vis.g = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + ",0)");


    // vis.radius = d3.scaleLinear()
    //     // .domain()
    //     .range([5.5, 20]);

    // Use party color scale defined in main.js

    vis.xAxis = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.height + ")")
    //     .call(d3.axisBottom(vis.x));

    // vis.yAxis = vis.g.append("g")
    //     .attr("transform", "translate(" + vis.margin.left + ",0)")
    //     .call(d3.axisLeft(vis.y));

    vis.yAxis = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + ", 0)")

    vis.xAxisLabel = vis.g.append("text")
        .attr("transform", `translate(${vis.width / 2}, ${vis.height + 42})`)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .style("font-size", "18px")
        .text("");

    // vis.xAxisTip = vis.g.append("text")
    //     .attr("transform", `translate(${vis.width}, ${vis.height - 15})`)
    //     .attr("text-anchor", "end")
    //     .attr("class", "axis-tip")
    //     .style("font-size", "14px")
    //     .text("More Donors From Majority-White Zipcodes ⟶");

    vis.yAxisLabel = vis.g.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .style("font-size", "18px")
        .attr("x", -vis.height / 2)
        .attr("y", -35)
        .text("Eviction Filings per 1,000 Households");


    // vis.yAxisTip = vis.g.append("text")
    //     .attr("transform", `rotate(-90)`)
    //     .attr('x', 0)
    //     .attr('y', 30)
    //     .attr("text-anchor", "end")
    //     .attr("class", "axis-tip")
    //     .style("font-size", "14px")
    //     .text("More Donors From High-Income Zipcodes ⟶");


    // vis.circles = vis.g.selectAll('circle');
    vis.circleContainer = vis.g.append("g");
    vis.plotLabelContainer = vis.g.append("g");
    vis.hoverCircleContainer = vis.g.append("g");

    vis.tip = d3.tip()
        .attr('class', 'd3-tip bubbleplot-tip')
        .html(d => {
            let tiptext = '<div style="text-align:center">';
            tiptext += `<span><strong>${d.properties.SPA_NAME}</strong></span><br><br>`;

            let evictionCount = typeof d.properties.eviction_filings[currentYear] === "undefined" ? 0 : d.properties.eviction_filings[currentYear]
            tiptext += `<span style="float: left;">Evictions Per 1,000 Households: </span> <span style="float: right;">${d3.format("0.1f")(1000*evictionCount / d.properties.total_HH)}</span><br>`;

            if (vis.selectVal === "housing_value_changes") {
                let housingValueChange = (typeof d.properties.housing_value_changes[currentYear] === "undefined" || d.properties.housing_value_changes[currentYear] === "") ? "N/A" : d3.format("+0.1%")(d.properties.housing_value_changes[currentYear]);
                tiptext += `<span style="float: left;">Change in Home Value (${currentYear-1}-${currentYear-2000}): </span> <span style="float: right;">${housingValueChange}</span><br>`;
            }
            else {
                let displayVal = (typeof d.properties[vis.selectVal] === "undefined" || d.properties[vis.selectVal] === "") ? "N/A" : d.properties[vis.selectVal];
                displayVal = vis.selectText.includes("%") ? d3.format("0.1%")(displayVal) : d3.format("$,.0f")(displayVal);

                tiptext += `<span style="float: left;">${vis.selectText}: </span> <span style="float: right;">${displayVal}</span><br>`;
            }
            
            tiptext += '</div>';

           return tiptext;
        });
    vis.svg.call(vis.tip);

    // vis.yVariable = 'education';

    vis.wrangleData();
};


BubblePlot.prototype.wrangleData = function() {
    const vis = this;

    vis.selectVal = $('#feature-select :selected').val();
    vis.selectText = $('#feature-select :selected').text();


    vis.x = d3.scaleLinear()
        .range([0, vis.width]);

    
    if (vis.selectVal === "housing_value_changes") {
        vis.x
            .domain([1.2*d3.min(geoData.features, d => d.properties[vis.selectVal][currentYear]),
                1.2*d3.max(geoData.features, d => d.properties[vis.selectVal][currentYear])]);
    }
    else if (vis.selectText.includes("%") === true) {
        vis.x
            .domain([0,1]);
    }
    else {
        vis.x
            .domain([0.9*d3.min(geoData.features, d => d.properties[vis.selectVal]), 1.1*d3.max(geoData.features, d => d.properties[vis.selectVal])]);
    }

    vis.y = d3.scaleLinear()
        .domain([0, 1.2*d3.max(geoData.features, d => 1000*(d.properties.eviction_filings[currentYear] / d.properties.total_HH))])
        .range([vis.height, 0]);


    vis.xAxis
        .call(d3.axisBottom(vis.x));

    vis.xAxisLabel
        .text(vis.selectText);

    vis.yAxis
        .transition()
        .duration(600)
        .call(d3.axisLeft(vis.y));


    vis.chartData = geoData.features.slice();
    vis.chartData = vis.chartData
        .filter(d => vis.selectVal === "housing_value_changes" ? typeof d.properties[vis.selectVal][currentYear] !== "undefined" : typeof d.properties[vis.selectVal] !== "undefined")
        .filter(d => typeof d.properties.eviction_filings[currentYear] !== "undefined");
        // .sort((a,b) => b.donor_count - a.donor_count );

    console.log(vis.chartData);

    // vis.radius
    //     .domain(d3.extent(vis.chartData, d => +d.donor_count));


    vis.updateVis();
};

BubblePlot.prototype.updateVis = function() {
    const vis = this;

    vis.circles = vis.circleContainer.selectAll("circle")
        .data(vis.chartData, d => d.properties.SPA_NAME)
        .join(
            enter => enter.append("circle")
                .attr('class', 'candidate-bubble')
                .attr("cx", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
                .attr("cy", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH))
                // .attr('cy', d => vis.y(100*d[vis.yAccessor]))
                // .attr('r', d => vis.radius(d.donor_count))
                .attr("r", 7)
                // .style('fill', d => partyColor(d.party))
                .style("fill", "orange")
                .style('opacity', vis.defaultBubbleOpacity)
                .style('stroke-width', '1px')
                .style('stroke', 'black'),

            update => update
                .call(update => update
                    .transition("move-bubbles")
                    .duration(1000)
                        .attr("cx", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
                        .attr("cy", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH))),

            exit => exit.remove()
        );
        

    // vis.labelShadows = vis.plotLabelContainer.selectAll("text.shadow")
    //     .data(vis.chartData, d => d.properties.SPA_NAME)
    //     .join(
    //         enter => enter.append("text")
    //             .attr("x", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
    //             .attr("y", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH) + 14)
    //             .attr("text-anchor", "middle")
    //             .attr("class", "shadow")
    //             .style("font-size", "11px")
    //             .style("stroke-width", "3px")
    //             .style("stroke", "white")
    //             .style("opacity", 1.0)
    //             .text(d => d.properties.SPA_NAME),

    //         update => update
    //             .style("opacity", 1.0)
    //             .call(update => update
    //                 .transition("move-labels")
    //                 .duration(1000)
    //                     .attr("x", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
    //                     .attr("y", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH) + 14)),

    //         exit => exit.remove()
    //     );

    // vis.plotLabels = vis.plotLabelContainer.selectAll("text.label")
    //     .data(vis.chartData, d => d.properties.SPA_NAME)
    //     .join(
    //         enter => enter.append("text")
    //             .attr("x", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
    //             .attr("y", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH) + 14)
    //             .attr("text-anchor", "middle")
    //             .attr("class", "label")
    //             .style("font-size", "11px")
    //             .style("stroke-width", "2px")
    //             .style("opacity", 1.0)
    //             .text(d => d.properties.SPA_NAME),

    //         update => update
    //             .style("opacity", 1.0)
    //             .call(update => update
    //                 .transition("move-labels")
    //                 .duration(1000)
    //                     .attr("x", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
    //                     .attr("y", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH) + 14)),

    //         exit => exit.remove()
    //     );


    vis.hoverCircles = vis.hoverCircleContainer.selectAll("circle")
        .data(vis.chartData, d => d.properties.SPA_NAME)
        .join(
            enter => enter.append("circle")
                .attr("cx", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
                .attr("cy", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH))

                // .attr('r', d => vis.radius(d.donor_count))
                .attr("r", 7)
                .style('opacity', 0.0)
                .on('mouseover', (d,i,n) => {
                    vis.tip.show(d);
                })
                //     let highlightTip = $(".bubbleplot-tip");

                //     // Get screen coordinates of the corresponding plot bubble
                //     let bubbleY = n[i].getBoundingClientRect().y;

                //     // Get the height of the tooltip to offset
                //     let tooltipHeight = highlightTip[0].getBoundingClientRect().height;

                //     highlightTip
                //         .css("position", "fixed")
                //         .css("top", bubbleY - tooltipHeight);
                // })
                .on('mouseout', vis.tip.hide),

            update => update
                .call(update => update
                    .transition("move-bubbles")
                    .duration(1000)
                        .attr("cx", d => vis.selectVal === "housing_value_changes" ? vis.x(d.properties[vis.selectVal][currentYear]) : vis.x(d.properties[vis.selectVal]))
                        .attr("cy", d => vis.y(1000*d.properties.eviction_filings[currentYear] / d.properties.total_HH))),

            exit => exit.remove()
        );
};

