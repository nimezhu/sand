export default function(layout, container, state, app) {
  var cfg = d3.select(container.getElement()[0]).append("div").classed("cfg", true);
  cfg.html("TODO config")
  var content = d3.select(container.getElement()[0]).append("div").classed("content", true);
  //var id = randomString(8)
  var div1 = content.append("div").style("width", "100px")
  var div2 = content.append("div").style("width", "100px")
  layout.eventHub.on("receiveMessage",function (d) {
    div1.html(d)
  })
  div2.append("input").attr("type","text").style("color","black").on("change",function(){
    var d = d3.select(this).node().value
    console.log(d)
    layout.eventHub.emit("sendMessage",d)
  })
  container.on("show", function(d) {
    div1.html("waiting for message")
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

