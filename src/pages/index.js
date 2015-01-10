var h = require('hyperscript')
var com = require('../com')

function notfound (state) {
  state.setPage(com.page(state, 'notfound', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-10.col-md-11', h('p', h('strong', 'Not Found')))
  )))
}

module.exports = {
  'address-book': require('./address-book'),
  adverts:        require('./adverts'),
  compose:        require('./compose'),
  feed:           require('./feed'),
  help:           require('./help'),
  inbox:          require('./inbox'),
  msg:            require('./message'),
  posts:          require('./posts'),
  notfound:       notfound,
  profile:        require('./profile'),
  setup:          require('./setup')
}