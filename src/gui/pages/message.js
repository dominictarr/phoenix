var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var content
  var msg = state.msgsById[state.page.param]
  if (msg) {
    content = com.page(state, 'message', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-7', com.messageThread(state, msg))
    ))
  } else {
    content = com.page(state, 'message', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-7', 'Message not found.')
    ))
  }

  document.body.innerHTML = ''
  document.body.appendChild(content)
}