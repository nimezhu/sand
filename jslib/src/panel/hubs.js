import trackIcon from "./trackIcon"
export default function() {
    var width = 296
    var height = 200
    var chart = function(selection) {
        var color = "#226a98"
        selection.each(function(d) {
            var el = d3.select(this)
            var e = el.append("g")
                //.attr("transform", "translate(" + x * xscale + "," + y * yscale + ")")
            var rect = e.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", color) //TODO note d.title but d.type ...
                .attr("opacity", 0.5)
            var maxrows = Math.floor((height - 85) / 20)
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

            e.append("text").attr("x", 5).attr("y", 27).text(d.genome)
            if (d.regions) {
                d.regions.forEach(function(r,i){
                    e.append("text").attr("x",80).attr("y",27+i*20).text(r.chr+":"+r.start+"-"+r.end)
                })
            }
            var l = d.trackViews.length
            if (l > maxrows) {
                e.append("text").attr("x", 5).attr("y", height - 70).style("font-size", "10px")
                    .text("... " + (l - maxrows + 1) + " more tracks")
                l = maxrows - 1
            }
            e.selectAll("g")
                .data(d.trackViews.slice(0, l))
                .enter()
                .append("g")
                .attr("transform", function(d, i) {
                    return "translate( 5," + (i * 20 + 45) + ")"
                })
                .call(trackIcon)
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
