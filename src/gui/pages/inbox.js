var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  // track read messages
  state.unreadMessages = 0
  localStorage.readMessages = JSON.stringify(state.inbox)

  var msgs = []
  for (var i=state.inbox.length-1; i>=0; i--) {
    var m = com.messageSummary(state, state.msgsById[state.inbox[i]])
    if (m) msgs.push(m)
  }

  var content = [h('table.table.message-feed', msgs)]
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
      h('hr'),
      com.sidehelp()
    )
  )))
}