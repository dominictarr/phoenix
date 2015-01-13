var h = require('hyperscript')
var multicb = require('multicb')
var com = require('../com')

module.exports = function (app) {
  var opts = { start: 0 }
  app.ssb.phoenix.getPosts(opts, function (err, msgs) {

    // markup

    var content
    if (msgs.length === 0) {
      content = [
        h('hr'),
        h('p', h('strong', 'You must be new, because your feed is empty!')),
        h('p', 
          'Let\'s fix that. Remember how, when facebook came out, you had to have a .edu to join? ',
          'Hah, screw that. Around here, you have to know a techie with a server to get connected.'
        ),
        h('p', 'You... do know a techie, right? Ask them for an invite code, then click ',
          h('button.btn.btn-xs.btn-primary', { onclick: app.followPrompt }, 'Add contact'),
          ' and copy+paste it into the popup. The rest happens automatically.'
        ),
        h('p',
          h('strong', 'Techies. '),
          'You run this show. ',
          com.a('https://github.com/ssbc/scuttlebot#running-your-own-pub-server', 'Set up a pub server'),
          ' and keep out the trolls.'
        ),
        h('p', 'Enjoy!')
      ]
    } else {
      content = h('table.table.message-feed', msgs.map(function (msg) {
        return com.messageSummary(app, msg)
      }))
    }
   
    var loadMoreBtn = (msgs.length === 30) ? h('p', h('button.btn.btn-primary', { onclick: loadMore }, 'Load More')) : ''
    app.setPage('posts', h('.row',
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