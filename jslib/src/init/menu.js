import factory from "../utils/factory"
export default function () {
  var dispatch
  var renders
  var renderList
  var chart = function (el) {
    var fixedToggle = false
    $("#fixedToggle").click(function () {
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
    var initMenu = function () {
      $(".menu > ul > li").click(function (event) {
        $(".menu .note").hide()
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
          $(this).find('.frame').mouseover(function(){
            sign = true
          })
          $(".menu > ul > li").removeClass("selected");
          $(this).addClass("selected");
        })
        $(".menu > ul > li").mouseout(function(){
            //$(this).find('.frame') //TODO
            if (!sign) {
              $(this).removeClass("selected");
              $(this).find('.frame').hide();
            }
        })
        ;
      });
    }
    initMenu();

    $(".frame").mouseout(function () {
      $(this).hide();
      $(".menu > ul > li").removeClass("selected");
      sign=false
    })

    $("#home").on("click", function () {
      window.location = "/v1/home.html"
    })
    $("#export").on("click", function (_) {
      dispatch.call("exportStates", this, _)
    })
    $("#import").on("click", function (d) {
      dispatch.call("importStates", this, function (d) {
        dispatch.call("electron", this, JSON.stringify({
          "code": "readFile",
          "data": d[0]
        }))
      })
    })
    $("#login").on("click", function (d) {
      window.location = "/login"
    })
    $("#logout").on("click", function (d) {
      window.location = "/logout"
    })
    $.get("/profile", function (d) {
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
    })
    $("#share").on("click", function (_) {
      dispatch.call("shareSession", this, _)
    })
    $("#saveToSheet").on("click", function (_) {

      dispatch.call("saveToSheet", this, _)
    })

    $("#loadFromSheet").on("click", function (_) {
      console.log("on click loadSheet")
      dispatch.call("loadFromSheet", this, _)
    })
    var checkSheetId = function () {
      d3.json("/getsheetid").then(function (d) {
        if (d.sheetid) {
          $("#sheetUi").show()
          $("#fileUi").hide()
          d3.select("#sessionUi").classed("glyphicon-hdd",false).classed("glyphicon-cloud",true)
        } else {
          $("#sheetUi").hide()
          $("#fileUi").show()
          d3.select("#sessionUi").classed("glyphicon-hdd",true).classed("glyphicon-cloud",false)
        }
      }).catch(function(d){
        console.log("E",d)
        $("#sheetUi").hide()
        $("#fileUi").show()
        d3.select("#sessionUi").classed("glyphicon-hdd",true).classed("glyphicon-cloud",false)
      })
    }
    //setTimeout(checkSheetId, null, 200)
    checkSheetId()
    $("#setSheetId").on("click", function (_) {
      if (!isAstilectron) {
        d3.json("/getsheetid").then(function (d) {
          //TODO
          console.log("D",d)
          var id = prompt("sheetId", d.sheetid || "")
          if (id != null && id != "") {
            $.post("/setsheetid?id=" + id).done(checkSheetId())
          }
        }).catch(function(e){
          console.log("E",e)
          var id = prompt("sheetId","")
          if (id != null && id != "") {
            $.post("/setsheetid?id=" + id).done(checkSheetId())
          }
        })
      } else {
        //var id = "1sl7ZkGWKX3Sx2yNLPpYNwVhBklVMXucVs4Ht9ukKVhw"
        var id = ""
        d3.json("/getsheetid").then(function (d) {
          if (d.sheetid) {
            $("#promptId").val(d.sheetid)
          } else {
            $("#promptId").val("")
          }
          $("#modalPrompt").modal("show");
          $("#promptOkBtn").click(function () {
            id = $("#promptId").val()
            $.post("/setsheetid?id=" + id).done(checkSheetId())
            $("#modalPrompt").modal("hide");
          })
        })

      }
    })
    var renderLis = d3.select("#renders").selectAll("li").data(renderList)
      .enter()
      .append("li")
      .attr("title",function(d){
        if (renders[d].tooltip) {
          return renders[d].tooltip
        } else {
          return d
        }
      })
      .on("click", function (d) {
        console.log("click", d)
        if (renders[d].id) {
          dispatch.call("add", this, factory(renders[d]))
        } else {
          dispatch.call("add", this, factory(d))
        }
      })

      renderLis.append("span")
      .classed("glyphicon",true)
      .classed("glyphicon-plus",true)
      renderLis.append("span")
      .attr("id", function (d) {
        return d
      }).text(
        function (d) {
          if (renders[d].label) {
            return " " + renders[d].label
          } else {
            return " " + d
          }
        }
      )

  }
  chart.dispatch = function (_) {
    return arguments.length ? (dispatch = _, chart) : dispatch;
  }
  chart.renders = function (_) {
    return arguments.length ? (renders = _, chart) : renders;
  }
  chart.renderList = function (_) {
    return arguments.length ? (renderList = _, chart) : renderList;
  }
  return chart
}
