export default function(layout, container, state, app) {
  var cfg = d3.select(container.getElement()[0]).append("div").classed("cfg", true);
  cfg.html("TODO config")
  var content = d3.select(container.getElement()[0]).append("div").classed("content", true);
  //var id = randomString(8)
  var div1 = content.append("div").style("width", "100px")
  
  container.on("show", function(d) {
    div1.html("TODO content")
    //div2.html("WAKEUP BRUSHING "+ regionsText(brush))
  })
  var resize = function() {
    console.log("resize")
  }
  var TO = false
  container.on("resize", function(e) {
    if (TO !== false) clearTimeout(TO)
    TO = setTimeout(resize, 200)
  })
}
