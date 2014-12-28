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

exports.prettydate = require('nicedate')

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
