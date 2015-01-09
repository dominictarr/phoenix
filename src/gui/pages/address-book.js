var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  state.setPage(com.page(state, 'network', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8',
      h('table.table.addresses',
        h('thead', h('tr', h('th', 'Name'), h('th', {width: '100'}), h('th.text-center', {width:'70'}, 'Follow'))),
        h('tbody',
          Object.keys(state.profiles).map(function(id) { 
            var profile = state.profiles[id]
            var otherNames = getOtherNames(state.names[id], profile)
            function r (e) { rename(e, id) }
            function f (e) { follow(e, id) }
            function unf (e) { unfollow(e, id) }
            return h('tr',
              h('td', 
                h('button.btn.btn-primary.btn-sm', { title: 'Rename', onclick: r }, com.icon('pencil')), ' ',
                h('strong', com.a('#/profile/'+id, state.names[id])),
                ' ', 
                (otherNames.length)
                  ? h('small.text-muted', 'aka ', otherNames.join(', '))
                  : ''
              ),
              h('td', 
                (state.hasEdge('trust', state.user.id, id)) ? h('small.text-muted', com.icon('lock'), ' trusted') : '',
                (state.hasEdge('flag', state.user.id, id)) ? h('small.text-muted', com.icon('flag'), ' flagged') : ''
              ),
              h('td.text-center', 
                (state.hasEdge('follow', state.user.id, id))
                  ? h('button.btn.btn-primary.btn-sm', { title: 'Unfollow', onclick: unf }, h('span.label.label-success', com.icon('ok')), ' ', com.icon('minus'))
                  : h('button.btn.btn-primary.btn-sm', { title: 'Follow', onclick: f }, com.icon('plus'))
              )
            )
          })
        )
      )
    ),
    h('.col-xs-2.col-md-3',
      com.adverts(state),
      h('hr'),
      com.sidehelp(state)
    )
  )))

  // handlers
  function rename (e, pid) {
    e.preventDefault()
    state.setNamePrompt(pid)
  }

  function follow (e, pid) {
    e.preventDefault()
    if (!state.hasEdge('follow', state.user.id, pid)) {
      state.addEdge('follow', pid, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else state.sync()
      })
    }
  }

  function unfollow (e, pid) {
    e.preventDefault()
    if (state.hasEdge('follow', state.user.id, pid)) {
      state.delEdge('follow', pid, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else state.sync()
      })
    }
  }
}

function getOtherNames(name, profile) {
  // todo - replace with ranked names

  // remove scare quotes 
  if (name.charAt(0) === '"' && name.charAt(name.length - 1) === '"')
    name = name.slice(1, -1)

  var names = []
  function add(n) {
    if (n && n !== name && !~names.indexOf(n))
      names.push(n)
  }

  // get 3 of the given or self-assigned names
  add(profile.self.name)
  for (var k in profile.given) {
    if (names.length >= 3)
      break
    add(profile.given[k].name)
  }
  return names
}