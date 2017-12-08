export default function() {
  var callback = function(d) {
    console.log("callback",d)
  }
  var chart = function(){
     var p = d3.select("body").append("div").style("display","none")
     var input = p.append("input").attr("type","file")
     $(input.node()).on("change",function(e){
       var reader = new FileReader();
       reader.onloadend = function(evt) {
         if (evt.target.readyState == FileReader.DONE) { // DONE == 2
           var d = JSON.parse(evt.target.result)
           callback(d)
         }
       }
       reader.readAsBinaryString(e.target.files[0]);
     })
     $(input.node()).click()
     p.remove()
  }
  chart.callback = function(_) { return arguments.length ? (callback= _, chart) : callback; }
  return chart
}
