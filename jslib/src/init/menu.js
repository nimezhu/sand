import factory from "../utils/factory"
export default function() {
    var dispatch
    var renders
    var renderList
    var chart = function(el) {
        var fixedToggle = false
        $("#fixedToggle").click(function() {
            fixedToggle = !fixedToggle;
            if (fixedToggle) {
                $(".lm_header").hide()
                $(".lm_items").height("+=20")
                $(".lm_item_container").height("+=20")
                $(".lm_content").height("+=18")
                $(this).css("color", "blue")
                $(this).attr("title", "show panel header")
                $("#openExt").closest("li").hide()
                $("#addPanel").closest("li").hide()
            } else {
                $(".lm_header").show()
                $(".lm_items").height("-=20")
                $(".lm_item_container").height("-=20")
                $(".lm_content").height("-=22")
                $(this).css("color", "")
                $(this).attr("title", "hide panel header")
                $("#openExt").closest("li").show()
                $("#addPanel").closest("li").show()
            }
        })
        var sign = false
        var TOHIDE
        $(".menu > ul > li").mouseover(function(event) {
            if (TOHIDE) {
                clearTimeout(TOHIDE)
            }
            if ($(event.target).closest(".frame").length === 1) {
                return;
            }
            $(".menu .frame").hide();
            $(this).find('.frame').show();
            $(".menu > ul > li").removeClass("selected");
            $(this).addClass("selected");
        })
        $(".menu > ul > li").mouseout(function() {
            //$(this).find('.frame') //TODO
            var t = $(this)
            TOHIDE = setTimeout(function(e) {
                if (!sign) {
                    t.removeClass("selected");
                    t.find('.frame').hide();
                }
            }, 500)
        })
        $('.frame').mouseover(function() {
            sign = true
        })
        $(".frame").mouseout(function() {
            $(".menu > ul > li").removeClass("selected");
            sign = false
        })

        $("#home").on("click", function() {
            window.location = "/v1/home.html"
        })

        var spaceOn = false
        var spaceUl = d3.select("#menuContainer").append("ul")
        var renderSpaceList = function(){
                var list = []
                for (var i = 0, len = localStorage.length; i < len; i++) {
                    var key = localStorage.key(i);
                    if (key.match(/^cnb-panel-/)) {
                        var name = key.replace("cnb-panel-", "")
                        list.push(name)
                    }

                }
                var _chart = function(selection) {
                    selection.each(function(d) {
                        var el = d3.select(this)
                        el.selectAll("*").remove()
                        el.append("span").text(d)
                        var elR = el.append("span").style("float","right")

                        elR.append("span").classed("glyphicon",true).classed("glyphicon-open",true).on("click", function() {
                                var v = localStorage.getItem("cnb-panel-" + d)
                                console.log("get panel", v,d)
                                var state = JSON.parse(v)
                                var a = {
                                    title: state.name,
                                    type: 'component',
                                    componentName: 'canvas',
                                    componentState: JSON.parse(JSON.stringify(state))
                                };
                                dispatch.call("loadPanel", this, a)
                            })
                        elR.append("span").classed("glyphicon",true).classed("glyphicon-remove",true).on("click",function(){
                                var v = localStorage.removeItem("cnb-panel-" + d)
                                el.remove()
                                dispatch.call("sendMessage",this,{code:"refreshWorkSpace",data:""})
                        })

                    })
                }
                var _li = spaceUl.selectAll("li").data(list)
                _li.exit().remove()
                _li.enter().append("li")
                    .merge(_li)
                    .call(_chart)

        }
        $("#space").on("click", function() {
            //TODO layout container togglea
            console.log("space click", spaceOn)
            if (spaceOn) {
                $("#menuContainer").width("0%").hide()
                $("#layoutContainer").width("100%").css("left", "0%")
                dispatch.call("resize", this, {})
            } else {
                $("#menuContainer").width("20%").show()
                $("#layoutContainer").width("80%").css("left", "20%")
                dispatch.call("resize", this, {})
                renderSpaceList() 
            }
            spaceOn = !spaceOn
        })
        dispatch.on("refreshWorkSpace",function(){
                renderSpaceList() 
        })
        $("#export").on("click", function(_) {
            dispatch.call("exportStates", this, _)
        })
        $("#import").on("click", function(d) {
            dispatch.call("importStates", this, function(d) {
                /*
                dispatch.call("electron", this, JSON.stringify({
                    "code": "readFile",
                    "data": d[0]
                }))
                */
            })
        })
        $("#login").on("click", function(d) {
            window.location = "/login"
        })
        $("#logout").on("click", function(d) {
            window.location = "/logout"
        })
        $.get("/profile", function(d) {
            d = JSON.parse(d);
            if (d.email) {
                $("#logout").show();
                $("#login").hide();
                $("#picture").show()
                var name = d.name
                if (name == "") {
                    name = d.email
                }
                $("#picture").attr("src", d.picture).attr("title", name)
            } else {
                $("#logout").hide();
                $("#login").show();
                $("#picture").hide();
            }
        }).fail(function(){
                $("#logout").hide();
                $("#login").hide();
                $("#picture").hide();

        })
        $("#share").on("click", function(_) {
            dispatch.call("shareSession", this, _)
        })
        $("#saveToSheet").on("click", function(_) {

            dispatch.call("saveToSheet", this, _)
        })

        $("#loadFromSheet").on("click", function(_) {
            console.log("on click loadSheet")
            dispatch.call("loadFromSheet", this, _)
        })
        var checkSheetId = function() {
            d3.json("/getsheetid", {
                credentials: 'same-origin'
            }).then(function(d) {
                if (d.sheetid && d.sheetid.length == 44) {
                    d3.select("#setSheetId").style("color", null)
                    d3.select("#createSheetId").style("display", "none")
                    $("#sheetUi").show()
                    $("#fileUi").hide()
                    d3.select("#sessionUi").classed("glyphicon-hdd", false).classed("glyphicon-cloud", true)
                } else {
                    d3.select("#setSheetId").style("color", "#A20")
                    d3.select("#createSheetId").style("display", null)
                    $("#sheetUi").hide()
                    $("#fileUi").show()
                    d3.select("#sessionUi").classed("glyphicon-hdd", true).classed("glyphicon-cloud", false)
                }
            }).catch(function(d) {
                $("#sheetUi").hide()
                $("#fileUi").show()
                d3.select("#sessionUi").classed("glyphicon-hdd", true).classed("glyphicon-cloud", false)
            })
        }
        //setTimeout(checkSheetId, null, 200)
        checkSheetId()
        $("#createSheetId").on("click", function() {
            $.ajaxSetup({
                xhrFields: {
                    withCredentials: true
                },
            });
            $.post("/gsheets/create").done(function() {
                checkSheetId()
            })
            $("#sessionFrame").hide()
            alert("New google sheet created, you can save and load sessions in your google sheet")
        })
        $("#setSheetId").on("click", function(_) {
            var setSheetId = function(id) {
                if (id != null && id != "" && id.length == 44) {
                    $.ajaxSetup({
                        xhrFields: {
                            withCredentials: true
                        },
                    });
                    $.post("/setsheetid?id=" + id).done(function() {
                        checkSheetId()
                    })
                } else if (id != null) {
                    $.post("/setsheetid?id=" + "null").done(function() {
                        checkSheetId()
                    })
                }
            }
            //if (!isAstilectron) {
                d3.json("/getsheetid", {
                    credentials: 'same-origin'
                }).then(function(d) {
                    //TODO
                    var id = prompt("sheetId", d.sheetid || "")
                    setSheetId(id)
                }).catch(function(e) {
                    var id = prompt("sheetId", "")
                    setSheetId(id)
                })

            //}
            /*
            else {
                var id = ""
                d3.json("/getsheetid", {
                    credentials: 'same-origin'
                }).then(function(d) {
                    if (d.sheetid) {
                        $("#promptId").val(d.sheetid)
                    } else {
                        $("#promptId").val("")
                    }
                    $("#modalPrompt").modal("show");
                    $("#promptOkBtn").click(function() {
                        id = $("#promptId").val()
                        $.post("/setsheetid?id=" + id).done(checkSheetId())
                        $("#modalPrompt").modal("hide");
                    })
                })

            }*/
        })
        var renderLis = d3.select("#renders").selectAll("li").data(renderList)
            .enter()
            .append("li")
            .attr("title", function(d) {
                if (renders[d].tooltip) {
                    return renders[d].tooltip
                } else {
                    return d
                }
            })
            .on("click", function(d) {
                console.log("click", d)
                $(".menu .frame").hide();
                if (renders[d].id) {
                    dispatch.call("add", this, factory(renders[d]))
                } else {
                    dispatch.call("add", this, factory(d))
                }
            })

        renderLis.append("span")
            .classed("glyphicon", true)
            .classed("glyphicon-plus", true)
        renderLis.append("span")
            .attr("id", function(d) {
                return d
            }).text(
                function(d) {
                    if (renders[d].label) {
                        return " " + renders[d].label
                    } else {
                        return " " + d
                    }
                }
            )

    }
    chart.dispatch = function(_) {
        return arguments.length ? (dispatch = _, chart) : dispatch;
    }
    chart.renders = function(_) {
        return arguments.length ? (renders = _, chart) : renders;
    }
    chart.renderList = function(_) {
        return arguments.length ? (renderList = _, chart) : renderList;
    }
    return chart
}
