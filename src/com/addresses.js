var h = require('hyperscript')
var com = require('./index')

module.exports = function (app, follows, trusts, flags) {
  var myid = app.api.getMyId()

  var addresses = Object.keys(app.api.getAllProfiles()).sort(sorter).map(function (id) { 
    var profile = app.api.getProfile(id)
    var otherNames = getOtherNames(profile)
    function r (e) { rename(e, id) }
    function f (e) { follow(e, id) }
    function unf (e) { unfollow(e, id) }
    var followbtn
    if (id !== myid) {
      followbtn = (follows[myid][id])
          ? h('button.btn.btn-primary.btn-sm', { title: 'Unfollow', onclick: unf }, h('span.label.label-success', com.icon('ok')), ' ', com.icon('minus'))
          : h('button.btn.btn-primary.btn-sm', { title: 'Follow', onclick: f }, com.icon('plus'))
    } else {
      followbtn = h('span.text-muted', 'you!')
    }
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
        (trusts[myid][id]) ? h('small.text-muted', com.icon('lock'), ' trusted') : '',
        (flags[myid][id]) ? h('small.text-muted', com.icon('flag'), ' flagged') : ''
      ),
      h('td.text-center', followbtn)
    )
  })

  // put followed and trusted friends at top
  function sorter(a, b) {
    var an = 0, bn = 0
    if (follows[myid][a]) an++
    if (trusts [myid][a]) an++
    if (flags  [myid][a]) an--
    if (follows[myid][b]) bn++
    if (trusts [myid][b]) bn++
    if (flags  [myid][b]) bn--
    return bn - an
  }

  // handlers
  function rename (e, pid) {
    e.preventDefault()
    app.setNamePrompt(pid)
  }

  function follow (e, pid) {
    e.preventDefault()
    if (!follows[myid][pid]) {
      app.api.addEdge('follow', pid, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      })
    }
  }

  function unfollow (e, pid) {
    e.preventDefault()
    if (follows[myid][pid]) {
      app.api.delEdge('follow', pid, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      })
    }
  }

  function getOtherNames(profile) {
    // todo - replace with ranked names
    var name = app.api.getNameById(profile.id)

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

  return addresses
}