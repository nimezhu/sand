import NewLayout from "./layout"
export default function() {
  var dispatch
  var eventInited = new Event('inited')
  var renders
  var renderList
  var layout
  var eventHub
  var app = {}
  var user
  //var _dispatch = d3.dispatch("updateApp")
  var callback = function(){}
  var chart = function(el){
    var initPanels = function(config, el) {
      layout = NewLayout(config, el, dispatch, renders, app)
      eventHub = layout.eventHub //TODO
      if (window) {
        window.layout = layout //TODO
      }
      eventHub.on("sendMessage",function(d){
        dispatch.call("sendMessage",this,d)
      })
      /* TODO: Consider Message Sender Looper */
      eventHub.on("sendMessage",function(d){
        eventHub.emit("receiveMessage",d)
      })
    }
    dispatch.on("initPanels", function(d) {
      $("#layoutContainer").empty();
      initPanels(d, $("#layoutContainer")) 
      window.dispatchEvent(eventInited)

    })
    dispatch.on("setState", function(d) {
      $("#layoutContainer").empty()
      initPanels(d, $("#layoutContainer"))
    })
    dispatch.on("receiveMessage.panels",function(d){
      //TODO Layout Event Emittion?
      eventHub.emit("receiveMessage",d)
      var k = d.code
      var v = JSON.parse(d.data)
      eventHub.emit(k,v)
    })

  }
  chart.dispatch = function(_) { return arguments.length ? (dispatch= _, chart) : dispatch; }
  chart.renders = function(_) { return arguments.length ? (renders= _, chart) : renders; }
  chart.renderList = function(_) { return arguments.length ? (renderList= _, chart) : renderList; }
  chart.layout = function(_) { return arguments.length ? (layout= _, chart) : layout; }
  chart.eventHub = function() {
    return eventHub
  }
  chart.callback = function(_) { return arguments.length ? (callback= _, chart) : callback; }
  chart.app = function(_) { return arguments.length ? (app=_ ,chart) : app; }
  chart.updateApp = function(_) {
    Object.keys(_).forEach(function(k){
      app[k]=_[k]
    })
  }
  chart.user = function(_) { return arguments.length ? (user= _, chart) : user; }
  return chart
}
