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
   
    app.setPage('posts', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-9', 
        h('p#get-latest.hidden', h('button.btn.btn-primary.btn-block', { onclick: app.refreshPage }, 'Get Latest')),
        com.paginator('#/posts?start=', opts.start, msgcount),
        h('table.table.message-feed', msgs.map(function (msg) { 
          if (msg.value) return com.messageSummary(app, msg, mustRenderOpts)
        })),
        com.paginator('#/posts?start=', opts.start, msgcount),
        com.introhelp(app)
      ),
      h('.hidden-xs.hidden-sm.col-md-2',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
      
  })
}