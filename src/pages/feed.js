var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

var rawOpts = {raw: true}
module.exports = function (app) {
  app.api.getFeed({ limit: 30, reverse: true }, function (err, msgs) {
    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', h('.message-feed', msgs.map(function (msg) { return com.message(app, msg, rawOpts) }))),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
  })
}