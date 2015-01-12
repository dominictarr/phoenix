var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function (app) {
  // track read messages
  app.unreadMessages = 0
  localStorage.readMessages = app.api.getInboxCount()

  var opts = { start: 0 }
  app.api.getInbox(opts, function (err, msgs) {

    // markup
    
    var content
    if (msgs.length === 0) {
      content = [
        h('p', h('strong', 'Your inbox is empty!')),
        h('p', 'When somebody @-mentions you or replies to your posts, you\'ll see their message here.')
      ]
    } else {
      content = h('table.table.message-feed', msgs.map(function (msg) {
        return com.messageSummary(app, msg)
      }))
    }

    var loadMoreBtn = (msgs.length === 30) ? h('p', h('button.btn.btn-primary', { onclick: loadMore }, 'Load More')) : ''
    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', content, loadMoreBtn),
      h('.col-xs-2.col-md-3', 
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))

    // handlers

    function loadMore (e) {
      e.preventDefault()
      opts.start += 30
      app.api.getInbox(opts, function (err, moreMsgs) {
        if (moreMsgs.length > 0) {
          moreMsgs.forEach(function (msg) { content.appendChild(com.messageSummary(app, msg)) })
        }
        // remove load more btn if it looks like there arent any more to load
        if (moreMsgs.length < 30)
          loadMoreBtn.parentNode.removeChild(loadMoreBtn)
      })
    }
  })
}