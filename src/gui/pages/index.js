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
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-11', h('p', h('strong', 'Not Found')))
    ))
  }),
  loading: simple(function(state) {
    return com.page(state, 'loading', h('.row',
      h('.col-xs-1', com.sidenav(state)),
      h('.col-xs-11', h('p', h('strong', 'loading...')))
    ))
  }),
  feed: require('./feed'),
  inbox: require('./inbox'),
  message: require('./message'),
  profile: require('./profile'),
  network: require('./network'),
  help: require('./help')
}