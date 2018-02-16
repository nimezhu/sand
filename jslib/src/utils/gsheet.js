var jsonp = function(url){
  	var script = window.document.createElement('script');
  	script.async = true;
  	script.src = url;
  	script.onerror = function()
  	{
  		alert('Can not access JSONP file.')
  	};
  	var done = false;
  	script.onload = script.onreadystatechange = function()
  	{
  		if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete'))
  		{
  			done = true;
  			script.onload = script.onreadystatechange = null;
  			if (script.parentNode)
  			{
  				return script.parentNode.removeChild(script);
  			}
  		}
  	};
  	window.document.getElementsByTagName('head')[0].appendChild(script);
  };
export default function(sql, sheetid, callback){
  	if (typeof callback == "undefined") {callback="console.log"}
  	var url = 'http://spreadsheets.google.com/a/google.com/tq?',
  	params = {
  		key: sheetid,
  		tq: encodeURIComponent(sql),
  		tqx: 'responseHandler:' + callback
  	},
  	qs = [];
  	for (var key in params)
  	{
  		qs.push(key + '=' + params[key]);
  	}
  	url += qs.join('&');
  	jsonp(url); // Call JSONP helper functiona
}
