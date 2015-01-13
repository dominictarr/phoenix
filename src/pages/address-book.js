var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('../com')

module.exports = function (app) {
  
  // fetch

  var done = multicb({ pluck: 1 })
  app.ssb.whoami(done())
  app.ssb.phoenix.getAllProfiles(done())
  app.ssb.phoenix.getNamesById(done())
  app.ssb.friends.all('follow', done())
  app.ssb.friends.all('trust', done())
  done(function (err, data) {

    // markup

    app.setPage('address-book', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8',
        h('table.table.addresses',
          h('thead', h('tr', h('th', 'Name'), h('th', {width: '100'}), h('th.text-center', {width:'70'}, 'Follow'))),
          h('tbody', com.addresses(app, data[0].id, data[1], data[2], data[3], data[4]))
        )
      ),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))

  })
}
