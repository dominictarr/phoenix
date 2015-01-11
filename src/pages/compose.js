var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function (app) {
  app.setPage('compose', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(app)),
    h('.col-xs-8',
      com.postForm(app)
    ),
    h('.col-xs-2.col-md-3',
      com.adverts(app),
      h('hr'),
      com.sidehelp(app)
    )
  ))
}