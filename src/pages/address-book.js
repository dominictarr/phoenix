var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('../com')

module.exports = function(app) {
  var done = multicb({ pluck: 1 })
  app.api.getGraph('follow', done())
  app.api.getGraph('trust', done())
  app.api.getGraph('flag', done())
  done(function (err, graphs) {
    app.setPage(com.page(app, 'address-book', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8',
        h('table.table.addresses',
          h('thead', h('tr', h('th', 'Name'), h('th', {width: '100'}), h('th.text-center', {width:'70'}, 'Follow'))),
          h('tbody', com.addresses(app, graphs[0], graphs[1], graphs[2]))
        )
      ),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    )))
  })
}
