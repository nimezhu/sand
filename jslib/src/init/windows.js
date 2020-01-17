//import toolsDownload from "../tools/download"
import toolsUpload from "../tools/upload"
import {
   dispatch as chan 
} from "@nucleome/nb-dispatch";

var isEmpty = function(layout) {
    if (layout.content[0].content.length == 0) {
        return true
    }
}
var emptyCfg = {
    "settings": {
        "showPopoutIcon": false
    },
    "dimensions": {
        "borderWidth": 2
    },
    "content": [{
        "type": "row",
        "content": []
    }]
}

export default function() {
    //var chromeExtID //= "gedcoafficobgcagmjpplpnmempkcpfp"
    //var chromeExtPort //port to chromeExtID
    var extId
    var user
    var sessionId = "_cnb_"
    var ws = {} //window handler
    var message = {}
    var idx = 1
    var config 
    var initedLayout = undefined
    var domain = ""
    var theme = "light"
    //var app = {}  //application variables; sync between windows;
    var P
    var dispatch = d3.dispatch("initWindows",
        "initPanels",
        "input",
        "resize",
        "add",
        "exportState",
        "exportStates",
        "setState",
        "importState",
        "importStates",
        "openExt",
        "closeExt",
        "eletron",
        "saveSession",
        "loadSession",
        "shareSession",
        "saveToSheet",
        "loadPanel",
        "sendMessage",
        "receiveMessage"
    );
    var win = "main" //default main

    /* external message processing */
    var getmessage = function(event) {
        if (event.origin !== domain) //TODO FIX
            return;

        var d = event.data
        if (d.code == "extMessage") { //external window to main window
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
        if (d.code == "setState") { //set state
            dispatch.call(d.code, this, d.data) //TODO PROGRMAMABLE
        }
        if (d.code == "app") { // set global variables
            d.data = JSON.parse(d.data)
            P.updateApp(d.data) //TODO app inited re-render
        }
        if (d.code == "addPanel") { // add new panel (mv panel between windows)
            var layout = P.layout();
            if (layout.root == null) {
                setTimeout(function() {
                    console.log("after 2 secs")
                    layout.root.contentItems[0].addChild(JSON.parse(d.data))
                }, 2000)
            } else {
                layout.root.contentItems[0].addChild(JSON.parse(d.data));
            }

        }
    }
    var chart = function(el) {
        window.addEventListener("message", getmessage, false);
        if (win == "main") {
            window.onbeforeunload = function() {
                dispatch.call("saveSession")
                dispatch.call("closeExt", this, {})
            }
            window.onload = function() {
                var d = localStorage.getItem(sessionId)
                if (!d && config == "continue") {
                    dispatch.call("initPanels", this, emptyCfg)
                }
                if (d && config == "continue") {
                    dispatch.call("initWindows", this, JSON.parse(d))
                    $(".menu .note").hide()
                }
                if (d && !config && typeof initedLayout == "undefined") { 
                    $("#myModal").modal("show");
                    d3.select("#loadSession").on("click", function() {
                        $("#myModal").modal("hide")
                        dispatch.call("initWindows", this, JSON.parse(d))
                    })
                    $(".menu .note").hide()
                }
            }
        }
        if (win == "main") {
            $("#openExt").on("click", function() {
                dispatch.call("openExt", this, {})
                window.name = "cnbMain"
            })
        } else {
            $("#openExt").hide()
        }
        /* Bridge nb-chan with local dispatch 
         * */
        var c = chan("update", "brush").extId(extId)

        c.connect(function(status) {
            if (status.connection != "Extension") {
                d3.select("#extension").style("display", null)
            }
        })
        c.on("receiveMessage.apps", function(d) {
            dispatch.call("receiveMessage", this, d)
        })
        dispatch.on("sendMessage.apps", function(d) {
            c.call("sendMessage", this, d)
        })
        /*
        c.on("sendMessage.apps",function(){

        })
        */

        dispatch.on("loadPanel", function(d) {
            var layout = P.layout()
            if (typeof layout.root.contentItems[0] == "undefined") {
                layout.root.addChild({
                    "type": "row",
                    "content": []
                })
            }
            layout.root.contentItems[0].addChild(d);
        })
        /* TODO popup*/
        dispatch.on("openExt", function(d) {
            var w = window.open("/v1/main.html?mode=web&win=ext&theme=" + theme + "&winid=" + idx, "external_" + idx, "width=1000,height=618")
            var id = idx //clone point
            w.onbeforeunload = function() {
                delete ws[id]
                dispatch.call("renderExtWinNav", this, {})
            }
            ws[id] = w
            ws[id].onload = function() {
                ws[id].postMessage({
                    code: "app",
                    data: JSON.stringify(P.app())
                }, domain) //parse app to other windows;
            }
            idx += 1
            if (typeof d.code != undefined) { //TODO setState code
                ws[id].addEventListener("inited", function() {
                    ws[id].postMessage(d, domain)
                })
            }
            dispatch.call("renderExtWinNav", this, {})
        })

        /* TODO:
         *
         */
        var winnav = function(selection) {
            selection.each(function(d) {
                var el = d3.select(this)
                el.selectAll("span").remove();
                var s = el.append("span")
                s.classed("glyphicon", true)
                    .classed("glyphicon-unchecked", true)
                s.text(d)
                s.on("click", function() {
                    ws[d].focus();
                }).on("mouseover", function() {
                    d3.select(this).classed("selected", true)
                }).on("mouseout", function() {
                    d3.select(this).classed("selected", false)
                })
            })
        }
        //TODO render win nav if it is ext windows
        if (win != "main" && window.opener) {
            var d = ["main"]
            d3.select("#extWinNav").selectAll("li")
                .data(d)
                .enter()
                .append("li")
                .append("span")
                .classed("glyphicon", true)
                .classed("glyphicon-unchecked", true)
                .on("mouseover", function() {
                    d3.select(this).classed("selected", true)
                })
                .on("mouseout", function() {
                    d3.select(this).classed("selected", false)
                })
                .on("click", function() {
                    var goBack = window.open('', 'cnbMain');
                    goBack.focus();
                })
                .text("main")

        }
        dispatch.on("renderExtWinNav", function() {
            if (win == "main") {
                var k = Object.keys(ws)
                var li = d3.select("#extWinNav").selectAll("li").data(k)
                li.exit().remove()
                li.enter()
                    .append("li")
                    .merge(li)
                    .call(winnav)
            }
        })
        dispatch.on("closeExt", function() {
            for (var key in ws) {
                ws[key].close()
            }
            ws = {}
        })
        dispatch.on("sendMessage.windows", function(d) {
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
        })
        var _getStates = function() {
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
        dispatch.on("shareSession", function() {
            var data = _getStates();
            $.ajaxSetup({
                xhrFields: {
                    withCredentials: true
                },
            });

            $.post("/upload", data).done(function(d) {
                var url = domain + "/v1/main.html?config=/share/" + d
                console.log("Session URL", url)
                prompt("Share Session within 7 days, Copy to clipboard: Ctrl+C, Enter", url)
            })
        })
        var _saveToSheet = function(d) {
            var data = _getStates();
            var d = {
                "id": d.id || "NoName",
                "note": d.note || "Todo",
                "data": data,
            }
            $.ajaxSetup({
                xhrFields: {
                    withCredentials: true
                },
            });

            $.post("/uploadsheet", JSON.stringify(d)).done(function(d) {
                if (d.error) {
                    console.log("error todo", d)
                }
            })
        }
        dispatch.on("saveToSheet", function(d) {
            $("#modalSave").modal("show");
            d3.select("#saveModalBtn").on("click", function() {
                //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
                var d = {
                    "id": d3.select("#modalSaveId").node().value,
                    "note": d3.select("#modalSaveNote").node().value,
                }
                _saveToSheet(d)
                $("#modalSave").modal("hide")
            })
        })
        dispatch.on("loadFromSheet", function() {
            d3.json("/sheetlist", {
                credentials: 'same-origin'
            }).then(function(d) {
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
                    .text(function(d, i) {
                        return i + " " + d[0];
                    })
                    .on("click", function(d, i) {
                        d3.select("#sheetList").select(".selected").classed("selected", false)
                        d3.select(this).classed("selected", true)
                        idx = i + 1
                    })
                a.exit().remove()
                d3.select("#loadModalBtn").on("click", function() {
                    //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
                    d3.json("/sheet?idx=" + idx, {
                        credentials: 'same-origin'
                    }).then(function(d) {
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
        dispatch.on("saveSession", function() {
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

            $.ajaxSetup({
                xhrFields: {
                    withCredentials: true
                },
            });

            $.ajax({
                url: "/setsession",
                type: "POST",
                data: data,
                async: false,
                success: function(msg) {
                    console.log(msg)
                }
            })


        })
        dispatch.on("loadSession", function() {
            var d = localStorage.getItem(sessionId)
            dispatch.call("initWindows", this, JSON.parse(d))
            $.ajaxSetup({
                xhrFields: {
                    withCredentials: true
                },
            });

            $.ajax({
                url: "/getsession",
                async: false,
                success: function(d) {
                    console.log("getsession", d)
                    $.ajax("/share/" + d.id, function(d) {
                        console.log(d)
                    })
                }
            })
        })

        var sessionDb = localforage.createInstance({
            "name": "nbSession"
        })


        dispatch.on("exportStates", function() {
            var data = _getStates()
            $("#modalSave").modal("show");
            d3.select("#saveModalBtn").on("click", function() {
                //window.location="/v1/main.html?config=/sheet?idx="+idx //TODO to Reload
                var d = {
                    "id": d3.select("#modalSaveId").node().value,
                    "note": d3.select("#modalSaveNote").node().value,
                    "data": data
                }
                //_saveToSheet(d)
                sessionDb.setItem(d.id, d)
                $("#modalSave").modal("hide")
            })

            //popup modal and save session to sessionDb
        })


        var fileUpload = toolsUpload().callback(function(d) { //TODO: Replace with dbget
            dispatch.call("initWindows", this, d)
        })

        dispatch.on("importStates", function(_) {
            sessionDb.keys().then(function(d) {
                var a = d3.select("#sheetList").selectAll("li").data(d);
                var idx = 1;
                a.enter()
                    .append("li")
                    .merge(a)
                    .text(function(d, i) {
                        return i + " " + d
                    })
                    .on("click", function(d, i) {
                        d3.select("#sheetList").select(".selected").classed("selected", false)
                        d3.select(this).classed("selected", true)
                        idx = i + 1
                    })
                a.exit().remove()
                d3.select("#sheetList").append("li").text("import from file...").on("click", function() {
                    d3.select("#sheetList").select(".selected").classed("selected", false)
                    d3.select(this).classed("selected", true)
                    idx = -1

                })

                d3.select("#loadModalBtn").on("click", function() {
                    $("#modalLoad").modal("hide")
                    if (idx == -1) {
                        fileUpload()
                    } else {
                        sessionDb.getItem(d[idx - 1]).then(function(d) {
                            dispatch.call("initWindows", this, JSON.parse(d.data))
                        })
                    }
                })
            })
            $("#modalLoad").modal("show");

        })


        dispatch.on("initWindows", function(d) {
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
                    dispatch.call("openExt", this, {
                        code: "setState",
                        data: JSON.parse(d[k])
                    })
                }
                dispatch.call("renderExtWinNav", this, {})
            }
        })
    }
    chart.initedLayout=function(_) {return arguments.length ? (initedLayout= _, chart) : initedLayout; }
    chart.extId = function(_) {
        return arguments.length ? (extId = _, chart) : extId;
    }
    chart.domain = function(_) {
        return arguments.length ? (domain = _, chart) : domain;
    }
    chart.dispatch = function(_) {
        return arguments.length ? (dispatch = _, chart) : dispatch;
    }
    chart.theme = function(_) {
        return arguments.length ? (theme = _, chart) : theme;
    }
    chart.P = function(_) {
        return arguments.length ? (P = _, chart) : P;
    }
    chart.sessionId = function(_) {
        return arguments.length ? (sessionId = _, chart) : sessionId;
    }
    chart.win = function(_) {
        return arguments.length ? (win = _, chart) : win;
    }
    chart.addPanel = function(_) {

    }
    chart.config = function(_) {
        return arguments.length ? (config = _, chart) : config;
    }
    /*
    chart.chromeExtID = function(_) {
        return arguments.length ? (chromeExtID = _, chart) : chromeExtID;
    }
    */
    chart.user = function(_) {
        return arguments.length ? (user = _, chart) : user;
    }
    //chart.app = function(_) { return arguments.length ? (app= _, chart) : app; }
    return chart
}
