var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function (app) {
  // track read messages
  app.unreadMessages = 0
  localStorage.readMessages = JSON.stringify([])// :TODO: app.inbox)

  app.api.getInbox({ start: 0, end: 30 }, function (err, msgs) {
    var content
    if (msgs.length === 0) {
      content = [
        h('p', h('strong', 'Your inbox is empty!')),
        h('p', 'When somebody @-mentions you or replies to your posts, you\'ll see their message here.')
      ]
    } else {
      content = h('table.table.message-feed', msgs.map(function (msg) {
        com.messageSummary(app, msg)
      }))
    }

    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', content),
      h('.col-xs-2.col-md-3', 
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
  })
}