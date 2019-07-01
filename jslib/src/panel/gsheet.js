export default function() {
    var width = 296
    var color = "#0f9d58"
    var height = 200
    var chart = function(selection) {
        selection.each(function(d) {
            var el = d3.select(this)
            var e = el.append("g")
            var rect = e.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", color) //TODO note d.title but d.type ...
                .attr("opacity", 0.5)
            e.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", 15)
                .attr("width", width)
                .attr("opacity", 0.5)
            e.append("text").attr("x", 5).attr("y", 11).attr("font-size", "10px")
                .attr("fill", "#F3FDD6")
                .text(d.name)
                .attr("pointer-events", "none")
            if (d.sheetId) {
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
            if (d.isPub) {
                rBtn.on("click", function() {
                    var uri = "https://docs.google.com/spreadsheets/d/" + d.sheetId + "/edit?usp=sharing"
                    window.open(uri)
                })

            } else {
                rBtn.on("click", function() {
                    var currentId = d.sheetId
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
                .text(d.sheetTitle)
                .attr("fill", "#F3FDD6")
                .attr("pointer-events", "none")
        }


        })
    }
    chart.width = function(_) {
        return arguments.length ? (width = _, chart) : width;
    }
    chart.height = function(_) {
        return arguments.length ? (height = _, chart) : width;
    }
    return chart


}
