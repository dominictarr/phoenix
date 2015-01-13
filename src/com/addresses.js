var h = require('hyperscript')
var com = require('./index')

module.exports = function (app, myid, profiles, names, follows, trusts) {

  // markup

  var addresses = Object.keys(profiles).sort(sorter).map(function (id) { 
    var profile = profiles[id]
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
        h('strong', com.a('#/profile/'+id, names[id]||id)),
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
    if (follows[myid][a]) an += 1
    if (trusts [myid][a]) an += trusts[myid][a]
    if (follows[myid][b]) bn += 1
    if (trusts [myid][b]) bn += trusts[myid][b]
    return bn - an
  }

  function getOtherNames(profile) {
    // todo - replace with ranked names
    var name = names[profile.id] || profile.id

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

  // handlers

  function rename (e, pid) {
    e.preventDefault()
    app.setNamePrompt(pid)
  }

  function follow (e, pid) {
    e.preventDefault()
    if (!follows[myid][pid]) {
      app.ssb.friends.follow(pid, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      })
    }
  }

  function unfollow (e, pid) {
    e.preventDefault()
    if (follows[myid][pid]) {
      app.ssb.friends.unfollow(pid, function(err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else app.refreshPage()
      })
    }
  }

  return addresses
}