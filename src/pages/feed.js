'use strict'
var h = require('hyperscript')
var com = require('../com')

var rawOpts = {raw: true}
module.exports = function (app) {
  var opts = { limit: 30, reverse: true }
  app.ssb.phoenix.getFeed(opts, function (err, msgs) {
    var lastMsg = msgs.slice(-1)[0]

    // markup

    var loadMoreBtn = (msgs.length === 30) ? h('p', h('button.btn.btn-primary.btn-block', { onclick: loadMore }, 'Load More')) : ''
    var content = h('.message-feed', msgs.map(function (msg) { return com.message(app, msg, rawOpts) }))
    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-9', content, loadMoreBtn),
      h('.hidden-xs.hidden-sm.col-md-2',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))

    // handlers

    function loadMore (e) {
      e.preventDefault()
      opts.lt = lastMsg
      app.ssb.phoenix.getFeed(opts, function (err, moreMsgs) {
        if (moreMsgs.length > 0) {
          moreMsgs.forEach(function (msg) { content.appendChild(com.message(app, msg, rawOpts)) })
          lastMsg = moreMsgs.slice(-1)[0]
        }
        // remove load more btn if it looks like there arent any more to load
        if (moreMsgs.length < 30)
          loadMoreBtn.parentNode.removeChild(loadMoreBtn)
      })
    }

  })
}