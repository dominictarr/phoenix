var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  state.setPage(com.page(state, 'network', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-2',
      h('p', h('strong', 'Known Users')),
      h('p', Object.keys(state.profiles).map(function(id) { 
        return h('span', com.a('#/profile/'+id, state.names[id]), h('br'))
      }))
    ),
    h('.col-xs-2',
      h('p', h('strong', 'Following')),
      h('p', state.user.following.map(function(id) { 
        return h('span', com.a('#/profile/'+id, state.names[id]), h('br'))
      }))
    ),
    h('.col-xs-2',
      h('p', h('strong', 'Followers')),
      h('p', state.user.followers.map(function(id) { 
        return h('span', com.a('#/profile/'+id, state.names[id]), h('br'))
      }))
    ),
    h('.col-xs-2',
      h('p', h('strong', 'Network Peers')),
      h('p', state.peers.map(function(peer) { 
        var addr = peer.host
        if (peer.port && peer.port != 2000)
          addr += ':'+peer.port
        return h('span', addr, h('br'))
      }))
    ),
    h('.col-xs-2.col-md-3',
      com.adverts(state),
      h('hr'),
      com.advertForm(state),
      h('hr'),
      com.sidehelp()
    )
  )))
}