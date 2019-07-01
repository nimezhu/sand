export default function() {
    var width = 296
    var color = "#af9ca4"
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
