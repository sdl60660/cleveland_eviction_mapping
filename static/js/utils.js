
// Used on flowchart/timeline for adding days to a given date and returning a new Date object
function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


// Used on flowchart/timeline for adding months to a given date and returning a new Date object
function addMonths(date, months) {
	returnDate = new Date(date.getTime());
	returnDate.setMonth(date.getMonth() + months);
	return returnDate;
}


// Used on flowchart/timeline for getting the difference, in months, between two dates
function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months;
}


// Used on flowchart highlight tile for getting a random int within a range
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


// Used for explicit wait before functions
const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}


// Used for setting/getting the corresponding element class/id for an outcome value with a space in it
function formatSpacedStrings(str) {
    return str.replace(/ /g, '-').replace(/\//g, '-');
}


function degreesToRadians(degrees) {
  const pi = Math.PI;
  return degrees * (pi/180);
}


function circlePlotCoordinates(radius, center, numItems, offset) {
    let output = [];
    for(let i = 0; i < numItems; i++) {
        let x = center[0] + radius * Math.cos(degreesToRadians(offset) + 2 * Math.PI * i / numItems);
        let y = center[1] + radius * Math.sin(degreesToRadians(offset) + 2 * Math.PI * i / numItems);

        output.push([x,y]);
    }

    return output;
}


function splitToChunks(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
}


function getCoordinates(origin, distance, angle) {
    let xCoordinate = Math.cos(angle*Math.PI/180) * distance + origin[0];
    let yCoordinate = Math.sin(angle*Math.PI/180) * distance + origin[1];

    return [xCoordinate, yCoordinate];
}


function getAngle(x1, y1, x2, y2) {
    let dy = y2 - y1;
    let dx = x2 - x1;
    let theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    //if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
}


function getDistance(x1, y1, x2, y2) {
    return Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );
};


function wrap(text, width) {
    text.each(function() {
        let text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 1,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", lineNumber++ * lineHeight + dy + "em").text(word);
            }
        }
    });
};

function nodeLinkWrap(text, innerCicleRadius) {

    text.each(function() {

        let text = d3.select(this),
            correspondingLink = text.attr("xlink:href"),
            startOffset = parseInt(text.attr("startOffset")),
            direction = text.attr("direction"),
            nodeAngle = text.attr("nodeAngle"),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        let path = document.getElementById(correspondingLink.replace("#", ""));
        let pathLength = path.getTotalLength();

        let buffer = 15;
        // let lineOffset = 0;
        if (direction === "outbound" && (nodeAngle > 90 || nodeAngle < -90)) {
            buffer += innerCicleRadius;
        }
        // else if (nodeAngle <= 90 && nodeAngle >= -90) {
        //     lineOffset = 2;
        // }
        let maxLength = pathLength - buffer - startOffset;


        let lastLength = -1;
        let newLength = 0;

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));

            lastLength = newLength;
            newLength = tspan.node().getComputedTextLength();

            if (newLength > maxLength || lastLength === newLength) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                    .attr("x", 0)
                    .attr("dy", lineNumber++ * lineHeight + dy + "em")
                    .text(word);

                lastLength = -1;
                newLength = 0;
            }

        }
    });
};

