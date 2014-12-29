exports.getJson = function(path, cb) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', path, true)
  xhr.responseType = 'json'
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var err
      if (xhr.status < 200 || xhr.status >= 400)
        err = new Error(xhr.status + ' ' + xhr.statusText)
      cb(err, xhr.response)
    }
  }
  xhr.send()
}

exports.postJson = function(path, obj, cb) {
  var xhr = new XMLHttpRequest()
  xhr.open('POST', path, true)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.responseType = 'json'
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var err
      if (xhr.status < 200 || xhr.status >= 400)
        err = new Error(xhr.status + ' ' + xhr.statusText)
      cb(err, xhr.response)
    }
  }
  xhr.send(JSON.stringify(obj))
}

;(function() {
  function createHandler(divisor,noun){
    return function(diff, useAgo){
      var n = Math.floor(diff/divisor);
      return "" + n + noun + ((useAgo) ? ' ago' : '');
    }
  }

  var formatters = [
    { threshold: 1,        handler: function(){ return      "just now" } },
    { threshold: 60,       handler: createHandler(1,        "s") },
    { threshold: 3600,     handler: createHandler(60,       "m") },
    { threshold: 86400,    handler: createHandler(3600,     "h") },
    { threshold: 172800,   handler: function(){ return      "yesterday" } },
    { threshold: 604800,   handler: createHandler(86400,    "d") },
    { threshold: 2592000,  handler: createHandler(604800,   "w") },
    { threshold: 31536000, handler: createHandler(2592000,  "mo") },
    { threshold: Infinity, handler: createHandler(31536000, "y") }
  ];

  exports.prettydate = function (date, useAgo) {
    var diff = (((new Date()).getTime() - date.getTime()) / 1000);
    for( var i=0; i<formatters.length; i++ ){
      if( diff < formatters[i].threshold ){
        return formatters[i].handler(diff, useAgo);
      }
    }
    throw new Error("exhausted all formatter options, none found"); //should never be reached
  }
})()

var escapePlain =
exports.escapePlain = function(str) {
  return (str||'')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

exports.shortString = function(str) {
  return str.slice(0, 6) + '...'
}