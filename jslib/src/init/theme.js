import loadCssJs from "../tools/loadCssJs"
import getUrlPara from "../tools/getUrlPara"
var themes = {
  "light": 1,
  "dark": 2,
  "soda": 3,
  "translucent":4,
}
export default function () {
  var theme = getUrlPara("theme")
  if (!theme || !themes[theme]) {
    theme = "light"
  }
  loadCssJs("/css/goldenlayout-" + theme + "-theme.css", "css")
  loadCssJs("/web/style/sand." + theme + ".css", "css")
  return theme
}
