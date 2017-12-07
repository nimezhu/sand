export default function () {
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
}
