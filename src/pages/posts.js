'use strict'
var h = require('hyperscript')
var com = require('../com')

module.exports = function (app) {

  var opts = { start: 0 }
  app.ssb.phoenix.getPosts(opts, function (err, msgs) {

    // markup

    var content = h('table.table.message-feed', msgs.map(function (msg) {
      return com.messageSummary(app, msg)
    }))

    var help = h('.row',
      h('.col-xs-4',
        com.panel(h('span', 'Join a Pub Server ', h('small', 'recommended')),
          h('div',
            h('p', 'Ask the owner of a pub server for an ', com.a('#/help/networking', 'invite code'), '.'),
            h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Use invite')
          )
        )
      ),
      h('.col-xs-4',
        com.panel('Connect over WiFi',
          h('p', 'Open the ', com.a('#/address-book', 'address book'), ' and find peers on your WiFi in the ', h('strong', 'Network'), ' column.')
        )
      ),
      h('.col-xs-4',
        com.panel(h('span', 'Start a Pub Server ', h('small', 'advanced')),
          h('p',
            com.a('https://github.com/ssbc/scuttlebot#running-your-own-pub-server', 'Follow these instructions'),
            ' then hand out invite codes to friends.'
          )
        )
      )
    )
   
    var loadMoreBtn = (msgs.length === 30) ? h('p', h('button.btn.btn-primary', { onclick: loadMore, style: 'margin-bottom: 24px' }, 'Load More')) : ''
    app.setPage('posts', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', content, loadMoreBtn, help),
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
      app.ssb.phoenix.getPosts(opts, function (err, moreMsgs) {
        if (moreMsgs.length > 0)
          moreMsgs.forEach(function (msg) { content.appendChild(com.messageSummary(app, msg)) })
        // remove load more btn if it looks like there arent any more to load
        if (moreMsgs.length < 30)
          loadMoreBtn.parentNode.removeChild(loadMoreBtn)
      })
    }
  })
}