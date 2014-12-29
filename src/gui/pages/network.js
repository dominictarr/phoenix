var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  state.setPage(com.page(state, 'network', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-10.col-sm-9.col-md-8.col-lg-7',
      h('p', h('strong', 'Network Peers')),
      h('p', state.peers.map(function(peer) { 
        var addr = peer.host
        if (peer.port && peer.port != 2000)
          addr += ':'+peer.port
        return h('span', addr, h('br'))
      })),
      h('p', h('strong', 'Known Users')),
      h('p', Object.keys(state.profiles).map(function(id) { 
        return h('span', com.a('#/profile/'+id, state.nicknames[id]), h('br'))
      }))      
    )
  )))
}