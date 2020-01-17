import * as GoldenLayout from "golden-layout"
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
    var duplicate = $("<li class='lm_dupbtn' title='duplicate'></li>") //TODO
    var rename = $("<li class='lm_renamebtn' title='rename'></li>") //TODO
    var save = $("<li class='lm_savebtn' title='save to space'></li>") //TODO
    var popout = $("<li class='lm_outbtn' title='pop out'></li>") //TODO
    var popin = $("<li class='lm_inbtn' title='pop in'></li>") //TODO
    stack.header.controlsContainer.prepend(popout);
    stack.header.controlsContainer.prepend(popin);
    stack.header.controlsContainer.prepend(duplicate);
    stack.header.controlsContainer.prepend(save);
    stack.header.controlsContainer.prepend(rename);
    stack.header.controlsContainer.prepend(toggle);
      rename.on("click", function(){
        var container = stack.getActiveContentItem().container;
        var state = container.getState()
        var newname = prompt("Set a new title for this panel", state.name);
        if (newname == null || newname == "") {
        } else {
            container.setTitle(newname)
            state.name = newname
            container.setState(state)
        }
      })
    toggle.on("click", function () {
      toggleConfig();
    })
    duplicate.on("click", function () {
      duplicatePanel();
    })
    popout.on("click", function () {
      popoutPanel();
    })
    popin.on("click", function () {
      popinPanel();
    })
    save.on("click",function(){
       savePanel()
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
    /* save panel to workspace */
    var panelDb = localforage.createInstance({name:"nbPanel"})
    var savePanel = function() {
      var container = stack.getActiveContentItem().container;
      var state = container.getState();
      var result = window.prompt("Panel Name:", state.name||"")
      if (result && result!=""){
          state.name = result
          //TODO Check Item Duplicated Name, and can override it.
          panelDb.setItem(result,JSON.stringify(state)).then(function(){
            dispatch.call("refreshWorkSpace",this,{})
            layout.eventHub.emit("sendMessage",{"code":"refreshWorkSpace","data":JSON.stringify({})}) //TODO
          })
      }
    }
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
      dispatch.call("openExt", this, {
        code: "addPanel",
        data: JSON.stringify(d)
      })
      container.close()
    }
    var popinPanel = function(d) {
      var container = stack.getActiveContentItem().container;
      var state = container.getState();
      var d = {
        title: state.name,
        type: 'component',
        componentName: 'canvas',
        componentState: JSON.parse(JSON.stringify(state))
      };
      window.opener.postMessage({code:"addPanel",data:JSON.stringify(d)},window.location.origin)
      container.close()
      if (layout.root.contentItems.length==0) {
          window.close()
      }
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
