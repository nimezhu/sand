export default function () {
  var color = {
    "Genome Browser": "#226a98",
    "User Data": "#ce5146",
    "DNA 3d Structure Viewer": "#337c2e"
  }
  var wh = function (d) {
    if (d.width) {
      console.log("width", d.width)
    }
    if (d.height) {
      console.log("height", d.height)
    }
  }
  var layout = function (d, el) {
    //wh(d)
    d.content.forEach(function (d) {
      r[d.type](d, 0, 0, 100, 100, el)
    })
  }
  var row = function (d, x, y, w, h, el) {
    //wh(d)
    if (d.content) {
      var offset = x;
      d.content.forEach(function (d) {
        r[d.type](d, offset, y, d.width || 100, h, el)
        offset += d.width || 100
      })
    }
  }
  var column = function (d, x, y, w, h, el) {
    //console.log("column", x, y)
    //wh(d)
    if (d.content) {
      var offset = y
      d.content.forEach(function (d) {
        r[d.type](d, x, offset, w, d.height || 100, el)
        offset += d.height || 100
      })
    }
  }
  var stack = function (d, x, y, w, h, el) {
    //console.log("stack", x, y)
    //wh(d)
    if (d.content) {
      d.content.forEach(function (d) {
        r[d.type](d, x + 1, y + 1, w - 2, h - 2, el) //stack Not change
      })
    }
  }
  var component = function (d, x, y, w, h, el) {
    var rect = el.append("rect")
      .attr("x", x * xscale)
      .attr("y", y * yscale)
      .attr("width", w * xscale)
      .attr("height", h * yscale)
      .attr("fill", color[d.title] || "grey")
      .attr("opacity", 0.5)
      .on("mouseover", function () {
        d3.select(this).attr("opacity", 0.8)
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.5)
      })
    if (d.componentState.genome) {
      el.append("text").attr("x", x * xscale + 5).attr("y", y * yscale + h * yscale / 2).text(d.componentState.genome)
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
  var chart = function (selection) {
    var d = selection.datum();
    layout(d, selection)
  }
  chart.xscale = function (_) {
    return arguments.length ? (xscale = _, chart) : xscale;
  }
  chart.yscale = function (_) {
    return arguments.length ? (yscale = _, chart) : yscale;
  }
  return chart
}
