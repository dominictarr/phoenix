var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function (app) {
  app.getPosts({ start: 0, end: 30 }, function (err, msgs) {

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
      content = h('table.table.message-feed', msgs.map(function (msg) { return com.messageSummary(app, msg) }))
    }

    app.setPage(com.page(app, 'feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', content),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    )))
  })
}