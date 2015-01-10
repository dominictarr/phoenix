var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var content
  var msg = state.msgsById[state.page.param]
  if (msg) {
    content = com.messageThread(state, msg, { fullLength: true })
  } else {
    content = 'Message not found.'
  }

  state.setPage(com.page(state, 'message', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8',
      content
    ),
    h('.col-xs-2.col-md-3',
      com.adverts(state),
      h('hr'),
      com.sidehelp(state)
    )
  )))
}