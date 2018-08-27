var colorMap = {
    "hic": "red",
    "bigwig": "black",
    "bigbed": "blue"
}

var trackIcon = function(selection) {
    selection.each(function(d, i) {
        var el = d3.select(this)
        el.append("rect")
            .attr("x", 2)
            .attr("y", -10)
            .attr("height", 10)
            .attr("width", 5)
            .attr("fill", function(d) {
                return colorMap[d.format] || "grey"
            })
            .attr("opacity", 0.5)
            .on("mouseover", function(d) {
                d3.select(this).attr("opacity",1.0)

            })
            .on("mouseout", function(d) {
                d3.select(this).attr("opacity",0.5)

            })
            .on("click", function(d) {
            })
        el.append("text")
            .attr("x", "10")
            .style("font-size", "10px")
            .text(d.id || d.longLabel)
    })
}

export default function() {
    var color = {
        "Genome Browser": "#226a98",
        "User Data": "#ce5146",
        "DNA 3d Structure Viewer": "#337c2e"
    }
    var wh = function(d) {
        if (d.width) {
            console.log("width", d.width)
        }
        if (d.height) {
            console.log("height", d.height)
        }
    }
    var layout = function(d, el) {
        //wh(d)
        d.content.forEach(function(d) {
            r[d.type](d, 0, 0, 100, 100, el)
        })
    }
    var row = function(d, x, y, w, h, el) {
        //wh(d)
        if (d.content) {
            var offset = x;
            d.content.forEach(function(d) {
                r[d.type](d, offset, y, d.width || 100, h, el)
                offset += d.width || 100
            })
        }
    }
    var column = function(d, x, y, w, h, el) {
        //console.log("column", x, y)
        //wh(d)
        if (d.content) {
            var offset = y
            d.content.forEach(function(d) {
                r[d.type](d, x, offset, w, d.height || 100, el)
                offset += d.height || 100
            })
        }
    }
    var stack = function(d, x, y, w, h, el) {
        //console.log("stack", x, y)
        //wh(d)
        if (d.content) {
            d.content.forEach(function(d) {
                r[d.type](d, x + 1, y + 1, w - 2, h - 2, el) //stack Not change
            })
        }
    }
    /* TODO */
    var component = function(d, x, y, w, h, el) {
        var e = el.append("g").attr("transform", "translate(" + x * xscale + "," + y * yscale + ")")
        var rect = e.append("rect")
            .attr("width", w * xscale)
            .attr("height", h * yscale)
            .attr("fill", color[d.title] || "grey")
            .attr("opacity", 0.5)
        var maxrows = Math.floor((h * yscale-35) / 20)
        if (d.componentState.genome) {
            e.append("text").attr("x", 5).attr("y", 15).text(d.componentState.genome)
        }
        if (d.componentState.trackViews) {
            var l = d.componentState.trackViews.length            
            if(l>maxrows){
                e.append("text").attr("x",5).attr("y", h*yscale -30 ).style("font-size","10px")
                .text("... "+(l-maxrows+1)+" more tracks")
                l=maxrows-1
            }
            e.selectAll("g")
                .data(d.componentState.trackViews.slice(0,l))
                .enter()
                .append("g")
                .attr("transform", function(d, i) {
                    return "translate( 5," + (i * 20 + 35) + ")"
                })
                .call(trackIcon)
        }
        rect.append("svg:title")
            .text(d.title || "unknown")
        //wh(d)

    }

    var r = {
        "row": row,
        "column": column,
        "stack": stack,
        "component": component
    }

    var xscale = 1.34
    var yscale = 0.8
    var chart = function(selection) {
        var d = selection.datum();
        layout(d, selection)
    }
    chart.xscale = function(_) {
        return arguments.length ? (xscale = _, chart) : xscale;
    }
    chart.yscale = function(_) {
        return arguments.length ? (yscale = _, chart) : yscale;
    }
    return chart
}
