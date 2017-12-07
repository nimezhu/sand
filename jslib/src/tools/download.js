export default function(fn, c) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(c);
  var p = d3.select("body").append("a").style("display","none")
  p.node().setAttribute("href", dataStr);
  p.node().setAttribute("download", fn);
  p.node().click();
  p.remove()
}
