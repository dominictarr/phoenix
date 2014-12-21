var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var msg = state.msgsById[state.page.param]
  if (msg) {
    state.setPage(com.page(state, 'message', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-7', com.messageThread(state, msg))
    )))
  } else {
    state.setPage(com.page(state, 'message', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-7', 'Message not found.')
    )))
  }
}