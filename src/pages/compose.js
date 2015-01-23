'use strict'
var h = require('hyperscript')
var com = require('../com')

module.exports = function (app) {
  app.setPage('compose', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(app)),
    h('.col-xs-10.col-md-9',
      com.postForm(app)
    ),
    h('.hidden-xs.hidden-sm.col-md-2',
      com.adverts(app),
      h('hr'),
      com.sidehelp(app)
    )
  ))
}