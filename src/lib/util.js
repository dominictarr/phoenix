exports.getJson = function(path, cb) {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', path, true)
  xhr.responseType = 'json'
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      cb(null, xhr.response)
    }
  }
  xhr.send()
}