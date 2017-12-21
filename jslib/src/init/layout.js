import render from "../render"
export default function(config, el, dispatch, renders, app) {
  var layout = new GoldenLayout(config, el);
  layout.registerComponent("canvas", function(container, state) {
    var r = renders[state.render] || render[state.render] //Sand
    if (r.render) {
      r = r.render
    }
    r(layout, container, state, app)
    container.on("show", function() {
      var k = container.getState()
      if (k.configView) {
        container.getElement().closest(".lm_item").addClass("s_cfg")
        container.getElement().closest(".lm_item").removeClass("s_content")
      } else {
        state.configView = false
        container.getElement().closest(".lm_item").addClass("s_content")
        container.getElement().closest(".lm_item").removeClass("s_cfg")
      }
    })
  });
  layout.on('stackCreated', function(stack) {
    var toggle = $("<li class='lm_cfgbtn' title='config'></li>")
    stack.header.controlsContainer.prepend(toggle);
    toggle.on("click", function() {
      toggleConfig();
    })
    var toggleConfig = function() {
      var container = stack.getActiveContentItem().container;
      var toggled = !container.getState().configView
      var state = container.getState()
      state.configView = toggled
      container.extendState({
        "configView": toggled
      });
      if (toggled) {
        container.getElement().closest(".lm_item").addClass("s_cfg").removeClass("s_content")
      } else {
        container.getElement().closest(".lm_item").addClass("s_content").removeClass("s_cfg")
      }
    };

  });
  layout.on("initialised", function() {

  })
  layout.init()
  layout.eventHub.on("updateApp",function(d){
    Object.keys(d).forEach(function(k){
      app[k]=d[k]
    })
    //app is local client window, in astilectron, need to send update app to new server when new window initialised.
  })
  dispatch.on("add", function(d) {
    if (!layout.root.contentItems[0]) {
        layout.root.addChild({
            "type": "row",
            "content": []
        })
    }
    layout.root.contentItems[0].addChild(d);
  })
  dispatch.on("resize.inner", function(d) {
    layout.updateSize();
  })
  return layout
}
