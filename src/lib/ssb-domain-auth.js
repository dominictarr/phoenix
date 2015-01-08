var querystr = require('querystring')
var address = require('ssb-address')

var ACCESS_PATH = '/access.json'
var AUTH_PATH = '/auth.html'

module.exports = {
  getToken: function(addr, cb) {
    addr = address(addr)
    var xhr = new XMLHttpRequest()
    xhr.open('GET', addr.domain+ACCESS_PATH, true)
    xhr.responseType = 'json'
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && cb) {
        var err
        if (xhr.status < 200 || xhr.status >= 400)
          err = new Error(xhr.status + ' ' + xhr.statusText)
        cb(err, xhr.response)
      }
    }
    xhr.send()
  },
  getAuthUrl: function(addr, opts) {
    addr = address(addr)
    opts = opts || {}
    opts.domain = window.location.protocol + '//' + window.location.host
    return addr.domain+AUTH_PATH+'?'+querystr.stringify(opts)
  },
  openAuthPopup: function(addr, opts, cb) {
    addr = address(addr)
    if (typeof opts == 'function') {
      cb = opts
      opts = null
    }
    cb = cb || function(){}
    opts = opts || {}
    opts.popup = 1
    window.open(this.getAuthUrl(addr, opts), null)

    // listen for messages from the popup
    window.addEventListener('message', onmsg)
    function onmsg(e) {
      if (e.origin !== addr.domain) return
      if (e.data == 'granted')
        cb(null, true)
      if (e.data == 'denied')
        cb(null, false)
      window.removeEventListener('message', onmsg)
    }
  },
  deauth: function(addr, cb) {
    addr = address(addr)
    var xhr = new XMLHttpRequest()
    xhr.open('DELETE', addr.domain+AUTH_PATH, true)
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && cb) {
        var err
        if (xhr.status < 200 || xhr.status >= 400)
          err = new Error(xhr.status + ' ' + xhr.statusText)
        cb(err)
      }
    }
    xhr.send()
  }
}