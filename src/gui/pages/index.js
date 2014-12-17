var h = require('hyperscript')
var com = require('../com')

module.exports = {
  notfound: function(state) {
    return com.page(state, 'notfound', h('p', h('strong', 'Not Found')))
  },
  loading: function(state) {
    return com.page(state, 'loading', h('p', h('strong', 'Loading...')))
  },
  feed: function(state) {
    return com.page(state, 'feed', h('p', h('strong', 'Feed')))
  },
  inbox: function(state) {
    return com.page(state, 'inbox', h('p', h('strong', 'Inbox')))
  },
  profile: function(state) {
    return com.page(state, 'profile', h('p', h('strong', 'profile')))
  },
  network: function(state) {
    return com.page(state, 'network', h('p', h('strong', 'network')))
  },
  help: function(state) {
    return com.page(state, 'help', h('p', h('strong', 'help')))
  }
}