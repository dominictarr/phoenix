var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  state.setPage(com.page(state, 'network', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8',
      h('h3', {style:'margin-top:0'}, 'Address Book'),
      h('table.table.table-bordered',
        h('thead', h('tr', h('th', 'Name'), h('th', {width:'70'}, 'Follow'), h('th', {width:'70'}, 'Trust'))),
        h('tbody',
          Object.keys(state.profiles).map(function(id) { 
            var profile = state.profiles[id]
            return h('tr',
              h('td', 
                h('strong', com.a('#/profile/'+id, state.names[id])),
                ' ', h('small.text-muted', 'aka bob ', h('strong', 'x5'), ' robert ', h('strong', 'x2')),
                ' ', (~state.user.followers.indexOf(id)) ? h('span.label.label-success', 'follows you') : '',
                h('button.btn.btn-primary.btn-sm.pull-right', {title: 'Change Name'}, com.icon('pencil'))
              ),
              h('td.text-center', 
                (~state.user.following.indexOf(id))
                  ? [

                    h('button.btn.btn-primary.btn-sm', {title: 'Unfollow'},h('span.label.label-success', com.icon('ok')), ' ', com.icon('minus'))
                  ]
                  : h('button.btn.btn-primary.btn-sm', {title: 'Follow'}, com.icon('plus'))
              ),
              h('td.text-center', 
                (~state.user.following.indexOf(id))
                  ? [

                    h('button.btn.btn-primary.btn-sm', {title: 'Untrust'},h('span.label.label-success', com.icon('ok')), ' ', com.icon('minus'))
                  ]
                  : h('button.btn.btn-primary.btn-sm', {title: 'Trust'}, com.icon('plus'))
              )
            )
          })
        )
      )
    ),
    // h('.col-xs-2',
    //   h('p', h('strong', 'Following')),
    //   h('p', state.user.following.map(function(id) { 
    //     return h('span', com.a('#/profile/'+id, state.names[id]), h('br'))
    //   }))
    // ),
    // h('.col-xs-2',
    //   h('p', h('strong', 'Followers')),
    //   h('p', state.user.followers.map(function(id) { 
    //     return h('span', com.a('#/profile/'+id, state.names[id]), h('br'))
    //   }))
    // ),
    // h('.col-xs-2',
    //   h('p', h('strong', 'Network Peers')),
    //   h('p', state.peers.map(function(peer) { 
    //     var addr = peer.host
    //     if (peer.port && peer.port != 2000)
    //       addr += ':'+peer.port
    //     return h('span', addr, h('br'))
    //   }))
    h('.col-xs-2.col-md-3',
      com.adverts(state),
      h('hr'),
      com.sidehelp()
    )
  )))
}