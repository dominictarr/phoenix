module.exports = function(state) {
  var hash = window.location.hash
  
  state.page.param = null
  if (hash == '#' || hash == '#/')
    state.page.id = 'feed'
  else if (hash == '#/network')
    state.page.id = 'network'
  else if (hash == '#/inbox')
    state.page.id = 'inbox'
  else if (hash.indexOf('#/profile/') === 0) {
    state.page.id = 'profile'
    state.page.param = hash.slice(10)
  } else if (hash.indexOf('#/msg/') === 0) {
    state.page.id = 'message'
    state.page.param = hash.slice(6)
  } else if (hash.indexOf('#/setup') === 0)
    state.page.id = 'setup'
  else if (hash.indexOf('#/help') === 0) {
    state.page.id = 'help'
    state.page.param = hash.slice(7) || 'intro'
  } else
    state.page.id = 'notfound'
}