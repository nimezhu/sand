(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.sand = global.sand || {})));
}(this, (function (exports) { 'use strict';

var simple = function(layout, container, state, app) {
  var cfg = d3.select(container.getElement()[0]).append("div").classed("cfg", true);
  cfg.html("TODO config");
  var content = d3.select(container.getElement()[0]).append("div").classed("content", true);
  //var id = randomString(8)
  var div1 = content.append("div").style("width", "100px");
  
  container.on("show", function(d) {
    div1.html("TODO content");
    //div2.html("WAKEUP BRUSHING "+ regionsText(brush))
  });
  var resize = function() {
    console.log("resize");
  };
  var TO = false;
  container.on("resize", function(e) {
    if (TO !== false) clearTimeout(TO);
    TO = setTimeout(resize, 200);
  });
};

var messenger = function(layout, container, state, app) {
  var cfg = d3.select(container.getElement()[0]).append("div").classed("cfg", true);
  cfg.html("TODO config");
  var content = d3.select(container.getElement()[0]).append("div").classed("content", true);
  //var id = randomString(8)
  var div1 = content.append("div").style("width", "100px");
  var div2 = content.append("div").style("width", "100px");
  layout.eventHub.on("receiveMessage",function (d) {
    div1.html(d);
  });
  div2.append("input").attr("type","text").style("color","black").on("change",function(){
    var d = d3.select(this).node().value;
    console.log(d);
    layout.eventHub.emit("sendMessage",d);
  });
  container.on("show", function(d) {
    div1.html("waiting for message");
    //div2.html("WAKEUP BRUSHING "+ regionsText(brush))
  });
  var resize = function() {
    console.log("resize");
  };
  var TO = false;
  container.on("resize", function(e) {
    if (TO !== false) clearTimeout(TO);
    TO = setTimeout(resize, 200);
  });
};

var render = {
  simple:simple,
  messenger:messenger,
};

var layoutIcon = function () {
  var color = {
    "hubs": "green",
    "img": "yellow",
    "bookmarks": "grey",
    "dna3d": "blue"
  };
  var wh = function (d) {
    if (d.width) {
      console.log("width", d.width);
    }
    if (d.height) {
      console.log("height", d.height);
    }
  };
  var layout = function (d, el) {
    console.log("layout");
    // default 100, 100
    wh(d);
    d.content.forEach(function (d) {
      r[d.type](d, 0, 0, 100, 100, el);
    });
  };
  var row = function (d, x, y, w, h, el) {
    console.log("row", x, y, w, h, el);
    wh(d);
    if (d.content) {
      var offset = x;
      d.content.forEach(function (d) {
        r[d.type](d, offset, y, d.width || 100, h, el);
        console.log(d);
        offset += d.width || 100;
      });
    }
  };
  var column = function (d, x, y, w, h, el) {
    console.log("column", x, y);
    wh(d);
    if (d.content) {
      var offset = y;
      d.content.forEach(function (d) {
        r[d.type](d, x, offset, w, d.height || 100, el);
        offset += d.height || 100;
      });
    }
  };
  var stack = function (d, x, y, w, h, el) {
    console.log("stack", x, y);
    wh(d);
    if (d.content) {
      d.content.forEach(function (d) {
        r[d.type](d, x, y, w, h, el); //stack Not change
      });
    }
  };
  var component = function (d, x, y, w, h, el) {
    console.log("component", x, y, w, h, d.title);
    console.log(el);
    el.append("rect")
      .attr("x", x * xscale)
      .attr("y", y * yscale)
      .attr("width", w * xscale)
      .attr("height", h * yscale)
      .attr("fill", color[d.title] || "grey")
      .attr("opacity", 0.5);
    wh(d);
  };

  var r = {
    "row": row,
    "column": column,
    "stack": stack,
    "component": component
  };

  var xscale = 1.34;
  var yscale = 0.8;
  var chart = function (selection) {
    var d = selection.datum();
    layout(d, selection);
  };
  chart.xscale = function (_) {
    return arguments.length ? (xscale = _, chart) : xscale;
  };
  chart.yscale = function (_) {
    return arguments.length ? (yscale = _, chart) : yscale;
  };
  return chart
};

var toolsDownload = function(fn, c) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(c);
  var p = d3.select("body").append("a").style("display","none");
  p.node().setAttribute("href", dataStr);
  p.node().setAttribute("download", fn);
  p.node().click();
  p.remove();
};

var toolsUpload = function() {
  var callback = function(d) {
    console.log("callback",d);
  };
  var chart = function(){
     var p = d3.select("body").append("div").style("display","none");
     var input = p.append("input").attr("type","file");
     $(input.node()).on("change",function(e){
       var reader = new FileReader();
       reader.onloadend = function(evt) {
         if (evt.target.readyState == FileReader.DONE) { // DONE == 2
           var d = JSON.parse(evt.target.result);
           callback(d);
         }
       };
       reader.readAsBinaryString(e.target.files[0]);
     });
     $(input.node()).click();
     p.remove();
  };
  chart.callback = function(_) { return arguments.length ? (callback= _, chart) : callback; };
  return chart
};

var getUrlPara = function (name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
};

var loadCssJs = function(filename, filetype) {
  if (filetype == "js") { //if filename is a external JavaScript file
    var fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", filename);
  } else if (filetype == "css") { //if filename is an external CSS file
    var fileref = document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", filename);
  }
  if (typeof fileref != "undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref);
};

var getBrowserType = function () {
  if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
    return "opera"
  } else if (navigator.userAgent.indexOf("Electron") != -1) {
    return "electron"
  } else if (navigator.userAgent.indexOf("Chrome") != -1) {
    return "chrome"
  } else if (navigator.userAgent.indexOf("Safari") != -1) {
    return "safari"
  } else if (navigator.userAgent.indexOf("Firefox") != -1) {
    return "firefox"
  } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) {
    return "ie"
  } else {
    return "unknown"
  }
};

var themes = {
  "light": 1,
  "dark": 2,
  "soda": 3,
  "translucent":4,
};
var theme = function () {
  var theme = getUrlPara("theme");
  if (!theme || !themes[theme]) {
    theme = "light";
  }
  loadCssJs("/css/goldenlayout-" + theme + "-theme.css", "css");
  loadCssJs("/web/style/sand." + theme + ".css", "css");
  return theme
};

var factory = function(d) {
  return {
    title: d,
    type: 'component',
    componentName: 'canvas',
    componentState: {
      name: d,
      render: d
    }
  };
};

var menu = function () {
  var dispatch;
  var renders;
  var renderList;
  var chart = function(el) {
    var fixedToggle = false;
    $("#fixedToggle").click(function () {
      fixedToggle = !fixedToggle;
      if (fixedToggle) {
        $(".lm_header").hide();
        $(".lm_items").height("+=20");
        $(".lm_item_container").height("+=20");
        $(".lm_content").height("+=18");
        $(this).css("color", "blue");
        $(this).attr("title", "show panel header");
        $("#openExt").closest("li").hide();
        $("#addPanel").closest("li").hide();
      } else {
        $(".lm_header").show();
        $(".lm_items").height("-=20");
        $(".lm_item_container").height("-=20");
        $(".lm_content").height("-=22");
        $(this).css("color", "");
        $(this).attr("title", "hide panel header");
        $("#openExt").closest("li").show();
        $("#addPanel").closest("li").show();
      }
    });
    var initMenu = function () {
      $(".menu > ul > li").click(function (event) {
        if ($(event.target).closest(".frame").length === 1) {
          return;
        }
        var $it = $(this);
        $it.find('.frame').show();
        $(".menu > ul > li").removeClass("selected");
        $(this).addClass("selected");

        $(".menu > ul > li").unbind();

        $(".menu > ul > li").mouseover(function () {
          if ($(event.target).closest(".frame").length === 1) {
            return;
          }
          $(".menu .frame").hide();
          $(this).find('.frame').show();
          $(".menu > ul > li").removeClass("selected");
          $(this).addClass("selected");
        });
      });
    };
    initMenu();

    $(".frame").mouseout(function () {
      $(this).hide();
    });

    $("#home").on("click",function(){
      window.location = "/v1/home.html";
    });
    $("#export").on("click", function(_) {
      dispatch.call("exportStates", this, _);
    });
    $("#import").on("click", function(d) {
      dispatch.call("importStates", this, function(d) {
        dispatch.call("electron", this, JSON.stringify({
          "code": "readFile",
          "data": d[0]
        }));
      });
    });
    $("#login").on("click", function(d) {
      window.location = "/login";
    });
    $("#logout").on("click", function(d) {
      window.location = "/logout";
    });
    $.get("/profile",function(d){
      d = JSON.parse(d);
      if (d.email) {
        $("#logout").show();
        $("#login").hide();
        $("#picture").show();
        var name = d.name;
        if (name=="") {
          name = d.email;
        }
        $("#picture").attr("src",d.picture).attr("title",name);
      } else {
        $("#logout").hide();
        $("#login").show();
        $("#picture").hide();
      }
    });
    $("#share").on("click",function(_){
      dispatch.call("shareSession",this,_);
    });
    $("#saveToSheet").on("click",function(_){

      dispatch.call("saveToSheet",this,_);
    });

    $("#loadFromSheet").on("click",function(_){
      console.log("on click loadSheet");
      dispatch.call("loadFromSheet",this,_);
    });
    var checkSheetId = function(){
      d3.json("/getsheetid",function(err, d){
        if (d.sheetid) {
          $("#sheetUi").show();
        } else {
          $("#sheetUi").hide();
        }
      });
    };
    checkSheetId();
    $("#setSheetId").on("click",function(_){
      if (!isAstilectron) {
        d3.json("/getsheetid",function(err, d){
            console.log(err,d);
            var id = prompt("sheetId",d.sheetid || "");
            if ( id != null && id!="") {
              $.post("/setsheetid?id="+id).done(checkSheetId());
            }
          });
      } else {
        //var id = "1sl7ZkGWKX3Sx2yNLPpYNwVhBklVMXucVs4Ht9ukKVhw"
        var id = "";
        d3.json("/getsheetid",function(err, d){
          if (d.sheetid) {
            $("#promptId").val(d.sheetid);
          } else {
            $("#promptId").val("");
          }
          $("#modalPrompt").modal("show");
          $("#promptOkBtn").click(function(){
            id = $("#promptId").val();
            $.post("/setsheetid?id="+id).done(checkSheetId());
            $("#modalPrompt").modal("hide");
          });
        });

      }
    });
    d3.select("#renders").selectAll("li").data(renderList)
      .enter()
      .append("li")
      .on("click", function(d) {
        console.log("click",d);
        dispatch.call("add", this, factory(d));
      })
      .append("span")
      .attr("id", function(d) {
        return d
      }).text(
        function(d) {
          return d
        }
      );

  };
  chart.dispatch = function(_) { return arguments.length ? (dispatch= _, chart) : dispatch; };
  chart.renders = function(_) { return arguments.length ? (renders= _, chart) : renders; };
  chart.renderList = function(_) { return arguments.length ? (renderList= _, chart) : renderList; };
  return chart
};

var NewLayout = function(config, el, dispatch, renders, app) {
  var layout = new GoldenLayout(config, el);
  layout.registerComponent("canvas", function(container, state) {
    var r = renders[state.render] || render[state.render]; //Sand
    r(layout, container, state, app);
    container.on("show", function() {
      var k = container.getState();
      if (k.configView) {
        container.getElement().closest(".lm_item").addClass("s_cfg");
        container.getElement().closest(".lm_item").removeClass("s_content");
      } else {
        state.configView = false;
        container.getElement().closest(".lm_item").addClass("s_content");
        container.getElement().closest(".lm_item").removeClass("s_cfg");
      }
    });
  });
  layout.on('stackCreated', function(stack) {
    var toggle = $("<li class='lm_cfgbtn' title='config'></li>");
    stack.header.controlsContainer.prepend(toggle);
    toggle.on("click", function() {
      toggleConfig();
    });
    var toggleConfig = function() {
      var container = stack.getActiveContentItem().container;
      var toggled = !container.getState().configView;
      var state = container.getState();
      state.configView = toggled;
      container.extendState({
        "configView": toggled
      });
      if (toggled) {
        container.getElement().closest(".lm_item").addClass("s_cfg").removeClass("s_content");
      } else {
        container.getElement().closest(".lm_item").addClass("s_content").removeClass("s_cfg");
      }
    };

  });
  layout.on("initialised", function() {

  });
  layout.init();
  layout.eventHub.on("updateApp",function(d){
    Object.keys(d).forEach(function(k){
      app[k]=d[k];
    });
    //app is local client window, in astilectron, need to send update app to new server when new window initialised. 
  });
  dispatch.on("add", function(d) {
    if (!layout.root.contentItems[0]) {
        layout.root.addChild({
            "type": "row",
            "content": []
        });
    }
    layout.root.contentItems[0].addChild(d);
  });
  dispatch.on("resize.inner", function(d) {
    layout.updateSize();
  });
  return layout
};

var windows = function () {
  var sessionId = "_cnb_";
  var ws = {}; //window handler
  var message = {};
  var idx = 1;
  var config;
  var domain = "";
  var theme = "light";
  //var app = {}  //application variables; sync between windows;
  var P;
  var dispatch = d3.dispatch("initWindows", "initPanels", "input", "resize", "add", "exportState", "exportStates", "setState", "importState", "importStates", "closeExt", "eletron", "saveSession", "loadSession", "shareSession","saveToSheet");
  var win = "main";
  var getmessage = function (event) {
    if (event.origin !== domain) //TODO FIX
      return;
    var d = event.data;
    if (d.code == "extMessage") {
      dispatch.call("receiveMessage", this, d.data);
      var id = parseInt(d.from.replace("external_", ""));
      for (var key in ws) {
        if (key != id) {
          ws[key].postMessage({
            code: "message",
            data: d.data
          }, domain);
        }
      }
    }
    if (d.code == "message") {
      dispatch.call("receiveMessage", this, d.data);
    }
    if (d.code == "setState") {
      dispatch.call(d.code, this, d.data); //TODO PROGRMAMABLE
    }
    if (d.code == "app") {
      console.log("init app", d.data);
      P.updateApp(d.data); //TODO app inited re-render
    }
  };
  var chart = function (el) {
    window.addEventListener("message", getmessage, false);
    if (win == "main") {
      window.onbeforeunload = function () {
        dispatch.call("saveSession");
        dispatch.call("closeExt", this, {});
      };
      window.onload = function () {
        var d = localStorage.getItem(sessionId);
        if (d && config=="continue") {
          dispatch.call("initWindows", this, JSON.parse(d));
        }
        if (d && !config) { //TODO add config
          $("#myModal").modal("show");
          d3.select("#loadSession").on("click", function () {
            $("#myModal").modal("hide");
            console.log(d);
            dispatch.call("initWindows", this, JSON.parse(d));
          });
        }
      };
    }
    if (win == "main") {
      $("#openExt").on("click", function () {
        var w = window.open("/v1/main.html?mode=web&win=ext&theme=" + theme, "external_" + idx, "width=1000,height=618");
        var id = idx;
        w.onbeforeunload = function () {
          delete ws[id];
        };
        ws[id] = w;
        console.log("panel app",P.app());
        ws[id].onload = function () {
          ws[id].postMessage({
            code: "app",
            data: P.app()
          }, domain); //parse app to other windows;
        };
        idx += 1;
      });
    } else {
      $("#openExt").hide();
    }
    dispatch.on("closeExt", function () {
      for (var key in ws) {
        ws[key].close();
      }
      ws = {};
    });
    dispatch.on("sendMessage.windows", function (d) {
      for (var key in ws) {
        ws[key].postMessage({
          code: "message",
          data: d
        }, domain);
      }
      if (window.opener) {
        window.opener.postMessage({
          code: "extMessage",
          data: d,
          from: window.name
        }, domain);
      }
    });
    var _getStates = function () {
      var data = {};
      data[-2] = JSON.stringify(P.app()); // -2 store app
      data[-1] = JSON.stringify(P.layout().toConfig());
      for (var k in ws) {
        if (k > 0) {
          data[k] = JSON.stringify(ws[k].layout.toConfig());
        }
      }
      return JSON.stringify(data)
    };
    dispatch.on("shareSession", function () {
      var data = _getStates();
      $.post("/upload", data).done(function (d) {
        var url = domain + "/v1/main.html?config=/share/" + d;
        console.log("Session URL",url);
        prompt("Share Session within 8 hours, Copy to clipboard: Ctrl+C, Enter", url);
      });
    });
    var _saveToSheet = function(d) {
      var data = _getStates();
      var d = {
        "id": d.id || "NoName",
        "note": d.note || "Todo",
        "data": data,
      };
      $.post("/uploadsheet", JSON.stringify(d)).done(function(d){
        //TODO Refresh Sheet List
        //alert("save to sheet")
        if (d.error){
          console.log("error todo",d);
        }
      });
    };
    dispatch.on("saveToSheet", function(d) {
      $("#modalSave").modal("show");
      d3.select("#saveModalBtn").on("click", function(){
        //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
        var d = {
          "id" : d3.select("#modalSaveId").node().value,
          "note" : d3.select("#modalSaveNote").node().value,
        };
        _saveToSheet(d);
        $("#modalSave").modal("hide");
      });
    });
    dispatch.on("loadFromSheet", function () {
      console.log("in dispatch loadFromSheet");
      d3.json("/sheetlist",function(d){
        console.log(d);
        if (d.error) {
          console.log("error todo",d);
          return;
        } else {
          console.log(d);
        }
        var a = d3.select("#sheetList").selectAll("li").data(d);
        var idx = 1;
        a.enter()
          .append("li")
          .merge(a)
          .text(function(d,i){
            return i+" "+d[0];
          })
          .on("click",function(d,i){
            d3.select("#sheetList").select(".selected").classed("selected",false);
            d3.select(this).classed("selected",true);
            idx = i + 1;
          });
        a.exit().remove();
        d3.select("#loadModalBtn").on("click", function(){
          //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
          d3.json("/sheet?idx="+idx,function(err, d){
            if (err) {
              console.log(err);
            } else {
              if (d.error) {
                console.log("error todo",d);
              }  else {
                dispatch.call("initWindows",this,d);
              }
            }
          });
          $("#modalLoad").modal("hide");
        });
      });
      $("#modalLoad").modal("show");

    });
    dispatch.on("exportStates", function () {
      var data = _getStates();
      toolsDownload("scopeExt.json", data);
    });
    dispatch.on("saveSession", function () {
      var data = _getStates();
      var d = JSON.parse(data);
      var d1 = JSON.parse(d[-1]);
      //console.log(d1)
      if (Object.keys(d).length > 1 || (d1.content.length > 0 && d1.content[0].content && d1.content[0].content.length > 0)) { //have window or panels;
        localStorage.setItem(sessionId, data);
      } else {
        console.log("remove session");
        localStorage.removeItem(sessionId); //delete session...
      }

      $.ajax({
        url: "/setsession",
        type: "POST",
        data: data,
        async: false,
        success: function(msg) {
          console.log(msg);
        }
      });


    });
    dispatch.on("loadSession", function () {
      var d = localStorage.getItem(sessionId);

      dispatch.call("initWindows", this, JSON.parse(d));
      $.ajax({
        url: "/getsession",
        async: false,
        success: function(d) {
          console.log("getsession",d);
          $.ajax("/share/"+d.id,function(d){
            console.log(d);
          });
        }
      });
    });
    var fileUpload = toolsUpload().callback(function (d) {
      dispatch.call("initWindows", this, d);
    });
    dispatch.on("importStates", function (_) {
      fileUpload();
    });
    /*
    dispatch.on("input", function(d) {
      layout.eventHub.emit("input", d)
    })
    */


    dispatch.on("initWindows", function (d) {
      dispatch.call("closeExt", this, {});
      $("#layoutContainer").empty();
      var hasVars = false;
      var vars = {};
      if (d["states"]) {
        vars = JSON.parse(d["vars"]);
        d = JSON.parse(d["states"]);
        hasVars = "true";
      }
      if (d[-2]) { //app
        P.app(JSON.parse(d[-2]));
      }
      var dmain = JSON.parse(d[-1]);
      dispatch.call("initPanels", this, dmain);
      //initPanels(JSON.parse(d[-1]), $("#layoutContainer"))
      for (var k in d) {
        if (k > 0) {
          var id = idx;
          var w = window.open("/v1/main.html?mode=web&win=ext&theme=" + theme, "external_" + idx, "width=1000,height=618");
          ws[id] = w;
          ws[id].onbeforeunload = function () {
            delete ws[id];
          };
          ws[id].addEventListener('begin', function () {});
          message[id] = {
            code: "setState",
            data: JSON.parse(d[k])
          };
          ws[id].addEventListener('inited', function () {
            ws[id].postMessage(message[id], domain);
          });
          idx += 1;
        }
      }
    });
  };
  chart.domain = function (_) {
    return arguments.length ? (domain = _, chart) : domain;
  };
  chart.dispatch = function (_) {
    return arguments.length ? (dispatch = _, chart) : dispatch;
  };
  chart.theme = function (_) {
    return arguments.length ? (theme = _, chart) : theme;
  };
  chart.P = function (_) {
    return arguments.length ? (P = _, chart) : P;
  };
  chart.sessionId = function (_) {
    return arguments.length ? (sessionId = _, chart) : sessionId;
  };
  chart.win = function (_) {
    return arguments.length ? (win = _, chart) : win;
  };

  chart.config = function (_) {
    return arguments.length ? (config = _, chart) : config;
  };
  //chart.app = function(_) { return arguments.length ? (app= _, chart) : app; }
  return chart
};

function mapString(d) {
  var h = {};
  Object.keys(d).forEach(function (k) {
    h[k] = JSON.stringify(d[k]);
  });
  return h
}

function mapParse(d) {
  var d1 = JSON.parse(d);
  var h = {};
  Object.keys(d1).forEach(function (k) {
    try {
      var d0 = JSON.parse(d1[k]);
      h[k] = d0;
    } catch (e) {
      h[k] = d1[k];
    }

  });
  console.log(h);
  return h
}
var electron = function () {
  var dispatch;
  var dialogE;
  var astilectron;
  var output = "scopeExt.json";
  var dataProcessor = function (d) {
    console.log(d);
  };
  var P;
  var process = d3.dispatch("message", "app", "file", "data", "states", "resize", "refresh", "getState", "setState", "sendState");
  var chart = function (el) {
    $("#openExt").on("click", function () {
      console.log(P.app());
      console.log(mapString(P.app()));
      dispatch.call("electron", this, JSON.stringify({
        "code": "openExt",
        "data": mapString(P.app())
      }));
    });
    dispatch.on("electron", function (d) {
      astilectron.sendMessage(d);
    });
    process.on("app", function (_) { //server to client window.
      //TODO mapParse
      P.updateApp(mapParse(_));
    });
    process.on("resize", function (_) {
      dispatch.call("resize");
    });
    process.on("file", function (v) {
      var config = JSON.parse(v);
      if (config[-1] || config["states"]) { //windows format
        dispatch.call("initWindows", this, config);
      } else { // one window format
        dispatch.call("initPanels", this, config);
      }
    });
    process.on("states", function (v) { //gather all the states ...
      var o = JSON.parse(v) || {};
      var data = JSON.parse(o["states"]);
      data[-2] = JSON.stringify(P.app());
      data[-1] = JSON.stringify(P.layout().toConfig());
      if (output == "scopeExt.json") {
        toolsDownload(output, JSON.stringify(data));
      } else if (output == "gsheet") {
        dispatch.call("saveToGSheet",this,JSON.stringify(data));
      }
    });

    process.on("refresh", function () {
      location.reload();
    });
    process.on("setState", function (d) {
      var state = JSON.parse(d);
      dispatch.call("initPanels", this, state);
    });
    process.on("getState", function (d) {
      dispatch.call("electron", this, JSON.stringify({
        "code": "state",
        data: JSON.stringify(P.layout().toConfig())
      })); //TODO
    });
    process.on("message", function (d) {
      var d0;
      try {
        d0 = JSON.parse(d);
      } catch (e) {
        d0 = d;
      }
      dispatch.call("receiveMessage", this, d0);
    });
    process.on("data", function (d) {
      dispatch.call("input", this, d);
    });
    astilectron.onMessage(function (message) {
      var a = message.split(" ");
      var code = a.shift();
      var data = a.join(" ");
      process.call(code, this, data);
    });


    dispatch.on("importStates", function (_) {
      if (isAstilectron) {
        dialogE.showOpenDialog({
          properties: ['openFile'],
          filters: [{
            extensions: ['txt']
          }]
        }, function (d) {
          _(d);
        });
      }
    });
    dispatch.on("initWindows", function (d) {
      var hasVars = false;
      var vars = {};
      if (d["states"]) {
        vars = JSON.parse(d["vars"]);
        d = JSON.parse(d["states"]);
        hasVars = true;
      }
      if (d[-2]) {
        P.app(JSON.parse(d[-2]));
      }
      dispatch.call("initPanels", this, JSON.parse(d[-1]));
      for (var k in d) {
        if (k > 0) {
          console.log("sending K to CREATE", k, JSON.parse(d[k]));
          var v = vars[k] || app || {};
          if (!isAstilectron) {
            console.log("Astilectron is not ready");
            //var bk = k;

            (function (k) {
              setTimeout(
                function () {
                  var v = vars[k] || app;
                  //console.log("isAstilectron ready?",isAstilectron)
                  //console.log("sending k",k)
                  dispatch.call("electron", this,
                    JSON.stringify({
                      "code": "createExt",
                      "data": d[k],
                      "vars": v,
                      "id": k
                    }));
                }, 2000
              );
            })(k);


          } else {
            var v = vars[k] || app[k];
            dispatch.call("electron", this,
              JSON.stringify({
                "code": "createExt",
                "data": d[k],
                "vars": v,
                "id": k
              }));
          }

        }
      }

    });
    dispatch.on("exportStates", function (d) {
      dispatch.call("electron", this, JSON.stringify({
        code: "getStates",
        data: {}
      }));
    });
    dispatch.on("sendMessage.electron", function (d) {
      console.log("send message to electron", d);
      dispatch.call("electron", this, JSON.stringify({
        code: "message",
        data: d
      }));
    });
    dispatch.on("receiveMessage.electron", function (d) {
      //TODO.
    });
    dispatch.on("loadFromSheet", function () {
      d3.json("/sheetlist", function (d) {
        console.log(d);
        if (d.error) {
          console.log("error todo", d);
          return;
        } else {
          console.log(d);
        }
        var a = d3.select("#sheetList").selectAll("li").data(d);
        var idx = 1;
        a.enter()
          .append("li")
          .merge(a)
          .text(function (d, i) {
            return i + " " + d[0];
          })
          .on("click", function (d, i) {
            d3.select("#sheetList").select(".selected").classed("selected", false);
            d3.select(this).classed("selected", true);
            idx = i + 1;
          });
        a.exit().remove();
        d3.select("#loadModalBtn").on("click", function () {
          d3.json("/sheet?idx=" + idx, function (err, d) {
            if (err) {
              console.log(err);
            } else {
              if (d.error) {
                console.log("error todo", d);
              } else {
                dispatch.call("initWindows", this, d);
              }
            }
          });
          $("#modalLoad").modal("hide");
        });
      });
      $("#modalLoad").modal("show");
    });
    var note;
    var _saveToSheet = function (d) {
      note = {
          "id": d.id || "NoName",
          "note": d.note || "Todo",
      };
      output = "gsheet";
      dispatch.call("exportStates", this, d);
    };
    dispatch.on("saveToSheet", function (d) {
      $("#modalSave").modal("show");
      d3.select("#saveModalBtn").on("click", function () {
        //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
        var d = {
          "id": d3.select("#modalSaveId").node().value,
          "note": d3.select("#modalSaveNote").node().value,
        };
        _saveToSheet(d);
        $("#modalSave").modal("hide");
      });
    });
    dispatch.on("saveToGSheet",function(d){
      note.data = d;
      $.post("/uploadsheet", JSON.stringify(note)).done(function (d) {
        if (d.error) {
          console.log("error todo", d);
        }
        output = "scopeExt.json";
      });
    });

  };

  chart.dispatch = function (_) {
    return arguments.length ? (dispatch = _, chart) : dispatch;
  };
  chart.dialogE = function (_) {
    return arguments.length ? (dialogE = _, chart) : dialogE;
  };
  chart.astilectron = function (_) {
    return arguments.length ? (astilectron = _, chart) : astilectron;
  };
  chart.P = function (_) {
    return arguments.length ? (P = _, chart) : P;
  };
  chart.dataProcessor = function (_) {
    return arguments.length ? (dataProcessor = _, chart) : dataProcessor;
  };
  return chart


};

var panels = function() {
  var dispatch;
  var eventInited = new Event('inited');
  var renders;
  var renderList;
  var layout;
  var eventHub;
  var app = {};
  //var _dispatch = d3.dispatch("updateApp")
  var callback = function(){};
  var chart = function(el){
    var initPanels = function(config, el) {
      layout = NewLayout(config, el, dispatch, renders, app);
      eventHub = layout.eventHub; //TODO
      if (window) {
        window.layout = layout; //TODO
      }
      eventHub.on("sendMessage",function(d){
        dispatch.call("sendMessage",this,d);
      });
      /* TODO: Consider Message Sender Looper */
      eventHub.on("sendMessage",function(d){
        eventHub.emit("receiveMessage",d);
      });
    };
    dispatch.on("initPanels", function(d) {
      $("#layoutContainer").empty();
      initPanels(d, $("#layoutContainer"));
      window.dispatchEvent(eventInited);

    });
    dispatch.on("setState", function(d) {
      $("#layoutContainer").empty();
      initPanels(d, $("#layoutContainer"));
    });
    dispatch.on("receiveMessage.panels",function(d){
      //TODO Layout Event Emittion?
      eventHub.emit("receiveMessage",d);
      var k = d.code;
      var v = JSON.parse(d.data);
      eventHub.emit(k,v);
    });

  };
  chart.dispatch = function(_) { return arguments.length ? (dispatch= _, chart) : dispatch; };
  chart.renders = function(_) { return arguments.length ? (renders= _, chart) : renders; };
  chart.renderList = function(_) { return arguments.length ? (renderList= _, chart) : renderList; };
  chart.layout = function(_) { return arguments.length ? (layout= _, chart) : layout; };
  chart.eventHub = function() {
    return eventHub
  };
  chart.callback = function(_) { return arguments.length ? (callback= _, chart) : callback; };
  chart.app = function(_) { return arguments.length ? (app=_ ,chart) : app; };
  chart.updateApp = function(_) {
    Object.keys(_).forEach(function(k){
      app[k]=_[k];
    });
  };
  return chart
};

exports.render = render;
exports.layoutIcon = layoutIcon;
exports.toolsDownload = toolsDownload;
exports.toolsUpload = toolsUpload;
exports.toolsGetUrlPara = getUrlPara;
exports.toolsLoadCssJs = loadCssJs;
exports.toolsGetBrowserType = getBrowserType;
exports.initTheme = theme;
exports.initMenu = menu;
exports.NewLayout = NewLayout;
exports.NewWindowManager = windows;
exports.NewElectronManager = electron;
exports.NewPanelManager = panels;
exports.factory = factory;

Object.defineProperty(exports, '__esModule', { value: true });

})));
