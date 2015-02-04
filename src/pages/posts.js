'use strict'
var h = require('hyperscript')
var multicb = require('multicb')
var com = require('../com')

var mustRenderOpts = { mustRender: true }
module.exports = function (app) {
  var done = multicb({ pluck: 1 })
  var opts = { start: +app.page.qs.start || 0 }
  app.ssb.phoenix.getPostCount(done())
  app.ssb.phoenix.getPosts(opts, done())
  done(function (err, res) {
    var msgcount = res[0]
    var msgs = res[1]

    // markup

    var help = h('.row',
      h('.col-xs-4',
        com.panel(h('span', 'Join a Pub Server ', h('small', 'recommended')),
          h('div',
            h('p', 'Ask the owner of a pub server for an ', com.a('#/help/pubs', 'invite code'), '.'),
            h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Use an invite')
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
            com.a('https://github.com/ssbc/scuttlebot#running-a-pub-server', 'Follow these instructions'),
            ' then hand out invite codes to friends.'
          )
        )
      )
    )

    var prevBtn = h('a.btn.btn-primary', { href: '#/posts?start='+((opts.start - 30 > 0) ? opts.start - 30 : 0) }, '<')
    var nextBtn = h('a.btn.btn-primary', { href: '#/posts?start='+(opts.start+30) }, '>')
    if (opts.start <= 0) prevBtn.setAttribute('disabled', true)    
    if (opts.start+30 > msgcount) nextBtn.setAttribute('disabled', true)
   
    app.setPage('posts', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-9', 
        h('p#get-latest.hidden', h('button.btn.btn-primary.btn-block', { onclick: app.refreshPage }, 'Get Latest')),
        h('p', prevBtn, (opts.start + 1), ' - ', Math.min(msgcount, (opts.start + 30)), ' ('+msgcount+')', nextBtn),
        h('table.table.message-feed', msgs.map(function (msg) { 
          if (msg.value) return com.messageSummary(app, msg, mustRenderOpts)
        })),
        help
      ),
      h('.hidden-xs.hidden-sm.col-md-2',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
      
  })
}