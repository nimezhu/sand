import layoutIcon from "./layoutIcon"

import download from "./tools/download"


var niceFormat = d3.format(",")
var regionNiceText = function(d) {
    return d.chr + ":" + niceFormat(d.start) + "-" + niceFormat(d.end)
}
var regionsNiceText = function(d) {
    var r = []
    d.forEach(function(d) {
        r.push(regionNiceText(d))
    })
    return r.join(";")
}
var trans = function(d) {
    if (d == "-1") {
        return "main"
    }
    return "ext" + d
}

export default function() {
    var xscale = 2.70
    var yscale = 1.68
    var db
    var chart = function(selection) {
        var iconRender = layoutIcon().xscale(xscale).yscale(yscale)
        var _render = function(el) {
            el.each(function(d) {
                var div = d3.select(this).append("div")
                var allw = JSON.parse(d.data)
                var keys = Object.keys(allw)
                keys.sort(function(a,b){return parseInt(a)-parseInt(b)})
                if (keys[0]=="-2"){
                    keys.shift();
                }
                var darr = []
                keys.forEach(function(k) {
                    darr.push(JSON.parse(JSON.stringify(JSON.parse(allw[k]))));
                })
                var bar = div.append("div").style("height","20px")
                var ul = bar.append("ul").classed("nav", true).classed("nav-tabs", true)
                var tabdiv = div.append("div")
                var divs = tabdiv.selectAll(".tabdiv").data(darr)
                    .enter()
                    .append("div")
                    .classed("tabdiv", true)
                    .style("display", "none")
                    .append("svg")
                    .attr("width", 100*xscale)
                    .attr("height", 100*yscale)
                    .call(iconRender)

                var lis = ul.selectAll("li")
                    .data(keys)
                    .enter()
                    .append("li")
                    .on("click", function(d, i) {
                        tabdiv.selectAll(".tabdiv").style("display", "none")
                        ul.selectAll("li").classed("active", false)
                        tabdiv.select(".tabdiv:nth-child(" + (i + 1) + ")").style("display", null)
                        ul.select("li:nth-child(" + (i + 1) + ")").classed("active", true)
                    })
                    .text(function(k) {
                        return trans(k)
                    })
                    .attr("pointer-events", "none")
                if (keys.length==1) {
                    ul.style("display","none")
                }
                ul.select("li:nth-child(1)").classed("active", true)
                tabdiv.select(".tabdiv:nth-child(1)").style("display", null)
            })
        }
        selection.each(function(d,i) {
            var panels = d3.select(this)
            var head = panels.append("div")
                .classed("panel-heading", true)
                .style("height","40px")
            head.append("h3")
                .classed("panel-title", true)
                .style("float","left")
                .text(function(d) {
                    return d.id
                })
            var bodys = panels.append("div").classed("panel-body",true)
            var svgdiv = bodys.append("div").style("padding-bottom", "10px")
            var infodiv = bodys.append("div").style("padding-bottom", "10px").style("display","none")
            
            infodiv.append("div").style("overflow-wrap", "break-word")
                .style("padding", "5px")
                .style("height", "100px")
                .style("overflow-y", "auto")
                .text(function(d) {
                    return d.note
                })
            var regions = infodiv.append("div")
            var regionsDiv = regions.append("div")
                .style("height", "50px")
                .style("overflow-y", "auto")
            regionsDiv.text(function(d) {
                var k = JSON.parse(JSON.parse(d.data)[-2])
                if (k.regions) {
                    return regionsNiceText(k.regions)
                } else {
                    return "null"
                }
            })

            
            var btnGrp = head.append("div").append("span").style("float", "right").style("padding-right", "0px")
             btnGrp.append("button")
                .classed("btn", true)
                .classed("btn-default", true)
                .classed("btn-xs", true)
                .on("click", function() {
                    //Toggle Information Sign
                    var el = d3.select(this)
                    if (el.classed("btn-default")) {
                        el.classed("btn-default",false)
                        el.classed("btn-success",true)
                        svgdiv.style("display","none")
                        infodiv.style("display",null)
                    } else {
                        el.classed("btn-default",true)
                        el.classed("btn-success",false)
                        svgdiv.style("display",null)
                        infodiv.style("display","none")
                    }
                })
                .classed("glyphicon",true)
                .classed("glyphicon-info-sign",true)
                .attr("title","information")


            btnGrp.append("button")
                .classed("btn", true)
                .classed("btn-default", true)
                .classed("btn-xs", true)
                .on("click", function() {
                    window.open("/v1/main.html?config=localstorage:"+d.id)
                })
                .classed("glyphicon",true)
                .classed("glyphicon-open",true)
                .attr("title","open")

            btnGrp.append("button")
                .classed("btn", true)
                .classed("btn-default", true)
                .classed("btn-xs", true)
                .on("click", function(d) {
                   download("nb_session.json",d.data)
                })
                .classed("glyphicon",true)
                .classed("glyphicon-download",true)
                .attr("title","download")
             btnGrp.append("button")
                .classed("btn", true)
                .classed("btn-default", true)
                .classed("btn-xs", true)
                .on("click", function() {
                   var a = window.confirm("Delete "+d.id+" ?")
                    if (a) {
                        db.removeItem(d.id)
                        panels.remove();
                    }
                })
                .classed("glyphicon",true)
                .classed("glyphicon-remove",true)
                .attr("title","delete")

            
            
            svgdiv.call(_render)
        })

    }
    chart.xscale = function(_) {
        return arguments.length ? (xscale = _, chart) : xscale;
    }
    chart.yscale = function(_) {
        return arguments.length ? (yscale = _, chart) : yscale;
    }
    chart.db = function(_) {
        return arguments.length ? (db = _, chart) : db;
    }
    return chart
}
