import toolsDownload from "../tools/download"

function mapString(d) {
  var h = {};
  Object.keys(d).forEach(function (k) {
    h[k] = JSON.stringify(d[k])
  })
  return h
}

function mapParse(d) {
  var d1 = JSON.parse(d)
  var h = {};
  Object.keys(d1).forEach(function (k) {
    try {
      var d0 = JSON.parse(d1[k])
      h[k] = d0
    } catch (e) {
      h[k] = d1[k]
    }

  })
  console.log(h)
  return h
}
export default function () {
  var dispatch
  var dialogE
  var astilectron
  var output = "scopeExt.json"
  var dataProcessor = function (d) {
    console.log(d)
  }
  var P
  var process = d3.dispatch("message", "app", "file", "data", "states", "resize", "refresh", "getState", "setState", "sendState")
  var chart = function (el) {
    $("#openExt").on("click", function () {
      console.log(P.app())
      console.log(mapString(P.app()))
      dispatch.call("electron", this, JSON.stringify({
        "code": "openExt",
        "data": mapString(P.app())
      }))
    })
    dispatch.on("electron", function (d) {
      astilectron.sendMessage(d)
    });
    process.on("app", function (_) { //server to client window.
      //TODO mapParse
      P.updateApp(mapParse(_))
    })
    process.on("resize", function (_) {
      dispatch.call("resize")
    })
    process.on("file", function (v) {
      var config = JSON.parse(v)
      if (config[-1] || config["states"]) { //windows format
        dispatch.call("initWindows", this, config)
      } else { // one window format
        dispatch.call("initPanels", this, config)
      }
    })
    process.on("states", function (v) { //gather all the states ...
      var o = JSON.parse(v) || {}
      var data = JSON.parse(o["states"])
      data[-2] = JSON.stringify(P.app())
      data[-1] = JSON.stringify(P.layout().toConfig())
      if (output == "scopeExt.json") {
        toolsDownload(output, JSON.stringify(data))
      } else if (output == "gsheet") {
        dispatch.call("saveToGSheet",this,JSON.stringify(data))
      }
    })

    process.on("refresh", function () {
      location.reload();
    })
    process.on("setState", function (d) {
      var state = JSON.parse(d)
      dispatch.call("initPanels", this, state)
    })
    process.on("getState", function (d) {
      dispatch.call("electron", this, JSON.stringify({
        "code": "state",
        data: JSON.stringify(P.layout().toConfig())
      })) //TODO
    })
    process.on("message", function (d) {
      var d0
      try {
        d0 = JSON.parse(d)
      } catch (e) {
        d0 = d
      }
      dispatch.call("receiveMessage", this, d0)
    })
    process.on("data", function (d) {
      dispatch.call("input", this, d)
    })
    astilectron.onMessage(function (message) {
      var a = message.split(" ")
      var code = a.shift()
      var data = a.join(" ")
      process.call(code, this, data)
    });


    dispatch.on("importStates", function (_) {
      if (isAstilectron) {
        dialogE.showOpenDialog({
          properties: ['openFile'],
          filters: [{
            extensions: ['txt']
          }]
        }, function (d) {
          _(d)
        })
      }
    })
    dispatch.on("initWindows", function (d) {
      var hasVars = false;
      var vars = {}
      if (d["states"]) {
        vars = JSON.parse(d["vars"]);
        d = JSON.parse(d["states"]);
        hasVars = true;
      }
      if (d[-2]) {
        P.app(JSON.parse(d[-2]))
      }
      dispatch.call("initPanels", this, JSON.parse(d[-1]))
      for (var k in d) {
        if (k > 0) {
          console.log("sending K to CREATE", k, JSON.parse(d[k]))
          var v = vars[k] || app || {}
          if (!isAstilectron) {
            console.log("Astilectron is not ready");
            //var bk = k;

            (function (k) {
              setTimeout(
                function () {
                  var v = vars[k] || app
                  //console.log("isAstilectron ready?",isAstilectron)
                  //console.log("sending k",k)
                  dispatch.call("electron", this,
                    JSON.stringify({
                      "code": "createExt",
                      "data": d[k],
                      "vars": v,
                      "id": k
                    }))
                }, 2000
              )
            })(k)


          } else {
            var v = vars[k] || app[k]
            dispatch.call("electron", this,
              JSON.stringify({
                "code": "createExt",
                "data": d[k],
                "vars": v,
                "id": k
              }))
          }

        }
      }

    })
    dispatch.on("exportStates", function (d) {
      dispatch.call("electron", this, JSON.stringify({
        code: "getStates",
        data: {}
      }));
    })
    dispatch.on("sendMessage.electron", function (d) {
      console.log("send message to electron", d)
      dispatch.call("electron", this, JSON.stringify({
        code: "message",
        data: d
      }))
    })
    dispatch.on("receiveMessage.electron", function (d) {
      //TODO.
    })
    dispatch.on("loadFromSheet", function () {
      d3.json("/sheetlist",{credentials: 'include'}).then(function (d) {
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
          d3.json("/sheet?idx=" + idx,{ credentials: 'include'}).then(function (d) {
              if (d.error) {
                console.log("error todo", d)
              } else {
                dispatch.call("initWindows", this, d)
              }
          }).catch(function(e) {
            console.log(e)
          })
          $("#modalLoad").modal("hide")
        })
      })
      $("#modalLoad").modal("show");
    })
    var note;
    var _saveToSheet = function (d) {
      note = {
          "id": d.id || "NoName",
          "note": d.note || "Todo",
      }
      output = "gsheet"
      dispatch.call("exportStates", this, d)
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
    dispatch.on("saveToGSheet",function(d){
      note.data = d
      $.post("/uploadsheet", JSON.stringify(note)).done(function (d) {
        if (d.error) {
          console.log("error todo", d)
        }
        output = "scopeExt.json"
      })
    })

  }

  chart.dispatch = function (_) {
    return arguments.length ? (dispatch = _, chart) : dispatch;
  }
  chart.dialogE = function (_) {
    return arguments.length ? (dialogE = _, chart) : dialogE;
  }
  chart.astilectron = function (_) {
    return arguments.length ? (astilectron = _, chart) : astilectron;
  }
  chart.P = function (_) {
    return arguments.length ? (P = _, chart) : P;
  }
  chart.dataProcessor = function (_) {
    return arguments.length ? (dataProcessor = _, chart) : dataProcessor;
  }
  return chart


}
