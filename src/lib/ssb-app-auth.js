var querystr   = require('querystring')

var HOST = 'localhost'
var PORT = 2000
var ACCESS_PATH = '/access.json'
var AUTH_PATH = '/auth.html'

module.exports = function (addr) {
  addr = addr || { host: HOST, port: PORT }
  var domain = 'http://'+(addr.host||HOST)+':'+(addr.port||PORT)

  return {
    getToken: function(cb) {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', domain+ACCESS_PATH, true)
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
    getAuthUrl: function(opts) {
      opts = opts || {}
      opts.domain = window.location.protocol + '//' + window.location.host
      return domain+AUTH_PATH+'?'+querystr.stringify(opts)
    },
    openAuthPopup: function(opts, cb) {
      if (typeof opts == 'function') {
        cb = opts
        opts = null
      }
      cb = cb || function(){}
      opts = opts || {}
      opts.popup = 1
      window.open(this.getAuthUrl(opts), null)

      // listen for messages from the popup
      window.addEventListener('message', onmsg)
      function onmsg(e) {
        if (e.origin !== domain) return
        if (e.data == 'granted')
          cb(null, true)
        if (e.data == 'denied')
          cb(null, false)
        window.removeEventListener('message', onmsg)
      }
    },
    deauth: function(cb) {
      var xhr = new XMLHttpRequest()
      xhr.open('DELETE', domain+AUTH_PATH, true)
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
}