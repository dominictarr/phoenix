var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var msg = state.msgsById[state.page.param]
  if (msg) {
    state.setPage(com.page(state, 'message', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(state)),
      h('.col-xs-10.col-sm-9.col-md-8.col-lg-7', com.messageThread(state, msg, { fullLength: true }))
    )))
  } else {
    state.setPage(com.page(state, 'message', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(state)),
      h('.col-xs-10.col-sm-9.col-md-8.col-lg-7', 'Message not found.')
    )))
  }
}