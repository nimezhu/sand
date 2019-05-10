var colorMap = {
    "hic": "red",
    "bigwig": "black",
    "bigbed": "blue"
}

var trackIcon = function(selection) {
    selection.each(function(d, i) {
        var el = d3.select(this)
        var bar = el.append("rect")
            .attr("x", 2)
            .attr("y", -10)
            .attr("height", 10)
            .attr("width", 10)
            .attr("fill", function(d) {
                return colorMap[d.format] || "grey"
            })
            .attr("opacity", 0.5)
            .on("mouseover", function(d) {
                if (d.metaLink) {
                    d3.select(this).attr("opacity", 1.0)
                }
            })
            .on("mouseout", function(d) {
                d3.select(this).attr("opacity", 0.5)

            })
            .on("click", function(d) {
                if (d.metaLink) {
                    window.open(d.metaLink)
                }
            })
            .append("svg:title")
            .text(d.longLabel || d.id)

        var txt = el.append("text")
            .attr("x", "15")
            .style("font-size", "10px")
            .style("cursor", "default")
            .text(d.id || d.longLabel)
            .attr("pointer-events", "null")

    })
}

export default function() {
    /*
    var color = {
        "Genome Browser": "#226a98",
        "Google Sheet": "#0f9d58",
        "DNA 3d Structure Viewer": "#ce5146"
    }
    */
   var color = {
        "hubs": "#226a98",
        "gsheet": "#0f9d58",
        "dna3d": "#ce5146",
        "weblink": "#89c8d3",
        "dna":"#af9ca4"
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
        if (d.content) {
            d.content.forEach(function(d) {
                r[d.type](d, 0, 0, 100, 100, el)
            })
            } else {
                console.log("TODO", d)
            }
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
        if (d.content) {
            var offset = y
            d.content.forEach(function(d) {
                r[d.type](d, x, offset, w, d.height || 100, el)
                offset += d.height || 100
            })
        }
    }
    var stack = function(d, x, y, w, h, el) {
        if (d.content) {
            d.content.forEach(function(d) {
                r[d.type](d, x, y, w - 1, h - 1, el) //stack Not change
            })
        }
    }
    /* TODO : multi windows show layout*/
    var component = function(d, x, y, w, h, el) {
        var e = el.append("g")
            .attr("transform", "translate(" + x * xscale + "," + y * yscale + ")")
        var width = w * xscale
        var height = h * yscale
        var rect = e.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", color[d.componentState.render] || "grey") //TODO note d.title but d.type ...
            .attr("opacity", 0.5)
        var maxrows = Math.floor((h * yscale - 45) / 20)
        e.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", 15)
            .attr("width", width)
            .attr("opacity", 0.5)
        e.append("text").attr("x", 5).attr("y", 11).attr("font-size", "10px")
            .attr("fill", "#F3FDD6")
            .text(d.componentState.name)
            .attr("pointer-events", "none")
        if (d.componentState.sheetId) {
            var btn = e.append("g")
                .attr("transform", "translate(5,35)")
            var rBtn = btn.append("rect")
                .attr("height", 20)
                .attr("width", 34)
                .attr("fill", "#123")
                .on("mouseover", function() {
                    d3.select(this).attr("opacity", 0.9)

                })
                .on("mouseout", function() {
                    d3.select(this).attr("opacity", 0.5)
                })
                .attr("opacity", 0.5)
            if (d.componentState.isPub) {
                rBtn.on("click", function() {
                    var uri = "https://docs.google.com/spreadsheets/d/" + d.componentState.sheetId + "/edit?usp=sharing"
                    window.open(uri)
                })

            } else {
                rBtn.on("click", function() {
                    var currentId = d.componentState.sheetId
                    window.open("https://docs.google.com/spreadsheets/d/" + currentId + "/edit")

                })
            }
            btn.append("rect")
                .attr("x", 34)
                .attr("height", 20)
                .attr("width", 74)
                .attr("fill", "#123")
                .attr("opacity", 0.3)

            btn.append("text").attr("y", 12).attr("x", 5)
                .attr("font-size", "10px")
                .attr("pointer-events", "none")
                .text("open")
                .attr("fill", "#F3FDD6")
            btn.append("text")
                .attr("x", 40)
                .attr("y", 12)
                .attr("font-size", "10px")
                .text(d.componentState.sheetTitle)
                .attr("fill", "#F3FDD6")
                .attr("pointer-events", "none")
        }
        if (d.componentState.genome) {
            e.append("text").attr("x", 5).attr("y", 27).text(d.componentState.genome)
        }
        if (d.componentState.trackViews) {
            var l = d.componentState.trackViews.length
            if (l > maxrows) {
                e.append("text").attr("x", 5).attr("y", h * yscale - 20).style("font-size", "10px")
                    .text("... " + (l - maxrows + 1) + " more tracks")
                l = maxrows - 1
            }
            e.selectAll("g")
                .data(d.componentState.trackViews.slice(0, l))
                .enter()
                .append("g")
                .attr("transform", function(d, i) {
                    return "translate( 5," + (i * 20 + 45) + ")"
                })
                .call(trackIcon)
        }
        //rect.append("svg:title")
        //    .text(d.title || "unknown")
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
        selection.each(function(d) {
            layout(d, d3.select(this))
        })
    }
    chart.xscale = function(_) {
        return arguments.length ? (xscale = _, chart) : xscale;
    }
    chart.yscale = function(_) {
        return arguments.length ? (yscale = _, chart) : yscale;
    }
    return chart
}
