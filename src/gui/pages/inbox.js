var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var msgs = []
  for (var i=state.inbox.length-1; i>=0; i--) {
    msgs.push(com.message(state, state.msgsById[state.inbox[i]]))
  }

  var content = [h('.message-feed', msgs)]
  if (msgs.length === 0) {
    content = content.concat([
      h('p', h('strong', 'Your inbox is empty!')),
      h('p', 'When somebody @-mentions you or replies to your posts, you\'ll see their message here.')
    ])
  }

  state.setPage(com.page(state, 'feed', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8', content),
    h('.col-xs-2.col-md-3', 
      com.adverts(state),
      com.advertForm(state),
      h('hr'),
      com.sidehelp()
    )
  )))
}