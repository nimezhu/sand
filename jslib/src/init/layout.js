import render from "../render"
export default function (config, el, dispatch, renders, app) {
  var layout = new GoldenLayout(config, el);
  layout.registerComponent("canvas", function (container, state) {
    var r = renders[state.render] || render[state.render] //Sand
    if (r.render) {
      r = r.render
    }
    r(layout, container, state, app)
    container.on("show", function () {
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
  layout.on('stackCreated', function (stack) {
    var toggle = $("<li class='lm_cfgbtn' title='config'></li>")
    var duplicate = $("<li class='lm_dupbtn' title='clone'></li>") //TODO
    var popout = $("<li class='lm_outbtn' title='popout'></li>") //TODO
    stack.header.controlsContainer.prepend(popout);
    stack.header.controlsContainer.prepend(duplicate);
    stack.header.controlsContainer.prepend(toggle);
    toggle.on("click", function () {
      toggleConfig();
    })
    duplicate.on("click", function () {
      duplicatePanel();
    })
    popout.on("click", function () {
      popoutPanel();
    })
    var toggleConfig = function () {
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

    var duplicatePanel = function () {
      var container = stack.getActiveContentItem().container;
      var state = container.getState();
      var d = {
        title: state.name,
        type: 'component',
        componentName: 'canvas',
        componentState: JSON.parse(JSON.stringify(state))
      };
      layout.root.contentItems[0].addChild(d);
    }
    var popoutPanel = function (d) {
      var container = stack.getActiveContentItem().container;
      var state = container.getState();
      var d = {
        title: state.name,
        type: 'component',
        componentName: 'canvas',
        componentState: JSON.parse(JSON.stringify(state))
      };


      //console.log("TODO send message to new inited window and sendMessage {code:addPanel,data:d} to new window and close current window")
      //console.log("close container",container)
      //TODO USING Dipatch
      /*
      var domain = "http://x7.andrew.cmu.edu:8080" //TODO
      var wt = window.open("/v1/main.html?mode=web&win=ext&theme=" + "light", "external_" + "t", "width=1000,height=618")
      wt.onload = function () {
        wt.postMessage({
          code: "app",
          data: JSON.stringify(app)
        }, domain) //parse app to other windows;
      }
      wt.addEventListener("inited",function(){
        wt.postMessage({code:"addPanel",data:JSON.stringify(d)},domain)
      })
      */
      dispatch.call("openExt", this, {
        code: "addPanel",
        data: JSON.stringify(d)
      })
      container.close()

    }

  });
  layout.on("initialised", function () {

  })
  layout.init()
  layout.eventHub.on("updateApp", function (d) {
    Object.keys(d).forEach(function (k) {
      app[k] = d[k]
    })
    //app is local client window, in astilectron, need to send update app to new server when new window initialised.
  })
  dispatch.on("add", function (d) {
    if (typeof layout.root.contentItems[0] == "undefined") {
      layout.root.addChild({
        "type": "row",
        "content": []
      })
    }
    layout.root.contentItems[0].addChild(d);
  })
  dispatch.on("resize.inner", function (d) {
    layout.updateSize();
  })
  return layout
}
