var h = require('hyperscript')
var com = require('../com')

function simple(cb) {
  return function(state) {
    state.setPage(cb(state))
  }
}

module.exports = {
  notfound: simple(function(state) {
    return com.page(state, 'notfound', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(state)),
      h('.col-xs-10.col-md-11', h('p', h('strong', 'Not Found')))
    ))
  }),
  setup: require('./setup'),
  feed: require('./feed'),
  inbox: require('./inbox'),
  message: require('./message'),
  profile: require('./profile'),
  network: require('./network'),
  help: require('./help')
}