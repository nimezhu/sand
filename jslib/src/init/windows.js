import toolsDownload from "../tools/download"
import toolsUpload from "../tools/upload"
var isEmpty = function (layout) {
  if (layout.content[0].content.length == 0) {
    return true
  }
}
export default function () {
  var chromeExtID = "gedcoafficobgcagmjpplpnmempkcpfp"
  var chromeExtPort //port to chromeExt

  var sessionId = "_cnb_"
  var ws = {} //window handler
  var message = {}
  var idx = 1
  var config
  var domain = ""
  var theme = "light"
  //var app = {}  //application variables; sync between windows;
  var P
  var dispatch = d3.dispatch("initWindows", "initPanels", "input", "resize", "add", "exportState", "exportStates", "setState", "importState", "importStates", "closeExt", "eletron", "saveSession", "loadSession", "shareSession", "saveToSheet")
  var win = "main" //default main
  var getmessage = function (event) {
    if (event.origin !== domain) //TODO FIX
      return;
    var d = event.data
    if (d.code == "extMessage") {
      dispatch.call("receiveMessage", this, d.data)
      var id = parseInt(d.from.replace("external_", ""))
      for (var key in ws) {
        if (key != id) {
          ws[key].postMessage({
            code: "message",
            data: d.data
          }, domain)
        }
      }
    }
    if (d.code == "message") {
      dispatch.call("receiveMessage", this, d.data)
    }
    if (d.code == "setState") {
      dispatch.call(d.code, this, d.data) //TODO PROGRMAMABLE
    }
    if (d.code == "app") {
      console.log("init app", d.data)
      P.updateApp(d.data) //TODO app inited re-render
    }
  }
  var chart = function (el) {
    window.addEventListener("message", getmessage, false);
    if (win == "main") {
      window.onbeforeunload = function () {
        dispatch.call("saveSession")
        dispatch.call("closeExt", this, {})
      }
      window.onload = function () {
        var d = localStorage.getItem(sessionId)
        if (d && config == "continue") {
          dispatch.call("initWindows", this, JSON.parse(d))
          $(".menu .note").hide()
        }
        if (d && !config) { //TODO add config
          $("#myModal").modal("show");
          d3.select("#loadSession").on("click", function () {
            $("#myModal").modal("hide")
            dispatch.call("initWindows", this, JSON.parse(d))
          })
          $(".menu .note").hide()
        }
      }
    }
    if (win == "main") {
      $("#openExt").on("click", function () {
        var w = window.open("/v1/main.html?mode=web&win=ext&theme=" + theme, "external_" + idx, "width=1000,height=618")
        var id = idx
        w.onbeforeunload = function () {
          delete ws[id]
        }
        ws[id] = w
        console.log("panel app", P.app())
        ws[id].onload = function () {
          ws[id].postMessage({
            code: "app",
            data: P.app()
          }, domain) //parse app to other windows;
        }
        idx += 1
      })

      if (typeof chrome !== "undefined") {
        var hasExtension = false;
        if (chrome.runtime) {
          chrome.runtime.sendMessage(chromeExtID, {
              message: "version"
            },
            function (reply) {
              if (reply) {
                if (reply.version) {
                  hasExtension = true;
                  connectExt();
                }
              } else {
                hasExtension = false;
              }
            });

          var connectExt = function () {
            chromeExtPort = chrome.runtime.connect(chromeExtID)
            var processingExternal = false;
            dispatch.on("sendMessage.apps", function (d) {
              if (processingExternal) {
                processingExternal = false;
              } else {
                chromeExtPort.postMessage(d) //send message to chromeExt
              }
            })
            chromeExtPort.onMessage.addListener(function (d) {
              processingExternal = true;
              dispatch.call("receiveMessage", this, {
                code: d.code,
                data: JSON.stringify(d.data)
              });
            })
          }
        }
      }

    } else {
      $("#openExt").hide()
    }
    dispatch.on("closeExt", function () {
      for (var key in ws) {
        ws[key].close()
      }
      ws = {}
    })
    dispatch.on("sendMessage.windows", function (d) {
      for (var key in ws) {
        ws[key].postMessage({
          code: "message",
          data: d
        }, domain)
      }
      if (window.opener !== null) {
        window.opener.postMessage({
          code: "extMessage",
          data: d,
          from: window.name
        }, domain)
      }
      /* TODO Connect Plugin */

    })
    var _getStates = function () {
      var data = {};
      data[-2] = JSON.stringify(P.app()) // -2 store app
      data[-1] = JSON.stringify(P.layout().toConfig())
      for (var k in ws) {
        if (k > 0) {
          data[k] = JSON.stringify(ws[k].layout.toConfig())
        }
      }
      return JSON.stringify(data)
    }
    dispatch.on("shareSession", function () {
      var data = _getStates();
      $.post("/upload", data).done(function (d) {
        var url = domain + "/v1/main.html?config=/share/" + d
        console.log("Session URL", url)
        prompt("Share Session within 8 hours, Copy to clipboard: Ctrl+C, Enter", url)
      })
    })
    var _saveToSheet = function (d) {
      var data = _getStates();
      var d = {
        "id": d.id || "NoName",
        "note": d.note || "Todo",
        "data": data,
      }
      $.post("/uploadsheet", JSON.stringify(d)).done(function (d) {
        if (d.error) {
          console.log("error todo", d)
        }
      })
    }
    dispatch.on("saveToSheet", function (d) {
      $("#modalSave").modal("show");
      d3.select("#saveModalBtn").on("click", function () {
        //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
        var d = {
          "id": d3.select("#modalSaveId").node().value,
          "note": d3.select("#modalSaveNote").node().value,
        }
        _saveToSheet(d)
        $("#modalSave").modal("hide")
      })
    })
    dispatch.on("loadFromSheet", function () {
      d3.json("/sheetlist", {
        credentials: 'include'
      }).then(function (d) {
        console.log(d)
        if (d.error) {
          console.log("error todo", d)
          return;
        } else {
          console.log(d)
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
            d3.select("#sheetList").select(".selected").classed("selected", false)
            d3.select(this).classed("selected", true)
            idx = i + 1
          })
        a.exit().remove()
        d3.select("#loadModalBtn").on("click", function () {
          //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
          d3.json("/sheet?idx=" + idx, {
            credentials: 'include'
          }).then(function (d) {
            var err = null //TODO
            if (err) {
              console.log(err)
            } else {
              if (d.error) {
                console.log("error todo", d)
              } else {
                dispatch.call("initWindows", this, d)
              }
            }
          })
          $("#modalLoad").modal("hide")
        })
      })
      $("#modalLoad").modal("show");

    })
    dispatch.on("exportStates", function () {
      var data = _getStates()
      toolsDownload("scopeExt.json", data)
    })
    dispatch.on("saveSession", function () {
      var data = _getStates()
      var d = JSON.parse(data) //TODO check data empty.
      var d1 = JSON.parse(d[-1])
      if (isEmpty(d1)) {
        return //not override previous one if layout of main window is empty
      }
      //console.log(d1)
      if (Object.keys(d).length > 1 || (d1.content.length > 0 && d1.content[0].content && d1.content[0].content.length > 0)) { //have window or panels;
        localStorage.setItem(sessionId, data)
      } else {
        console.log("remove session")
        localStorage.removeItem(sessionId) //delete session...
      }

      $.ajax({
        url: "/setsession",
        type: "POST",
        data: data,
        async: false,
        success: function (msg) {
          console.log(msg)
        }
      })


    })
    dispatch.on("loadSession", function () {
      var d = localStorage.getItem(sessionId)
      dispatch.call("initWindows", this, JSON.parse(d))
      $.ajax({
        url: "/getsession",
        async: false,
        success: function (d) {
          console.log("getsession", d)
          $.ajax("/share/" + d.id, function (d) {
            console.log(d)
          })
        }
      })
    })
    var fileUpload = toolsUpload().callback(function (d) {
      dispatch.call("initWindows", this, d)
    })
    dispatch.on("importStates", function (_) {
      fileUpload();
    })
    /*
    dispatch.on("input", function(d) {
      layout.eventHub.emit("input", d)
    })
    */


    dispatch.on("initWindows", function (d) {
      dispatch.call("closeExt", this, {})
      $("#layoutContainer").empty();
      var hasVars = false;
      var vars = {}
      if (d["states"]) {
        vars = JSON.parse(d["vars"])
        d = JSON.parse(d["states"]);
        hasVars = "true"
      }
      if (d[-2]) { //app
        P.app(JSON.parse(d[-2]))
      }
      var dmain = JSON.parse(d[-1])
      dispatch.call("initPanels", this, dmain)
      //initPanels(JSON.parse(d[-1]), $("#layoutContainer"))
      for (var k in d) {
        if (k > 0) {
          var id = idx
          var w = window.open("/v1/main.html?mode=web&win=ext&theme=" + theme, "external_" + idx, "width=1000,height=618")
          ws[id] = w
          ws[id].onbeforeunload = function () {
            delete ws[id]
          }
          ws[id].addEventListener('begin', function () {})
          message[id] = {
            code: "setState",
            data: JSON.parse(d[k])
          }
          ws[id].addEventListener('inited', function () {
            ws[id].postMessage(message[id], domain)
          })
          idx += 1
        }
      }
    })
  }
  chart.domain = function (_) {
    return arguments.length ? (domain = _, chart) : domain;
  }
  chart.dispatch = function (_) {
    return arguments.length ? (dispatch = _, chart) : dispatch;
  }
  chart.theme = function (_) {
    return arguments.length ? (theme = _, chart) : theme;
  }
  chart.P = function (_) {
    return arguments.length ? (P = _, chart) : P;
  }
  chart.sessionId = function (_) {
    return arguments.length ? (sessionId = _, chart) : sessionId;
  }
  chart.win = function (_) {
    return arguments.length ? (win = _, chart) : win;
  }

  chart.config = function (_) {
    return arguments.length ? (config = _, chart) : config;
  }
  chart.chromeExtID = function (_) {
    return arguments.length ? (chromeExtID = _, chart) : chromeExtID;
  }
  //chart.app = function(_) { return arguments.length ? (app= _, chart) : app; }
  return chart
}
