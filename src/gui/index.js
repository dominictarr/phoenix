var h = require('hyperscript')
var com = require('./com')
var pages = require('./pages')

var state = {
  user: {
    id: null
  },
  page: {
    id: null,
    param: null
  }
}

module.exports = function(ssb, feed, profiles, network) {
  return {
    setUserId: function(id) { state.user.id = id },
    setConnectionStatus: function (isConnected, message) {
      // :TODO:
    },
    renderPage: renderPage
  }
}

function renderPage(id, param) {
  state.page.id = id
  state.page.param = param

  var page = pages[id]
  if (!page)
    page = pages.notfound

  document.body.innerHTML = ''
  document.body.appendChild(page(state))
}