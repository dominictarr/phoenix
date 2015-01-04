module.exports = function(state) {
  var hash = window.location.hash
  
  // set the route
  state.page.param = null
  if (!hash || hash == '#' || hash == '#/')
    state.page.id = 'posts'
  else if (hash == '#/network')
    state.page.id = 'network'
  else if (hash == '#/inbox')
    state.page.id = 'inbox'
  else if (hash == '#/adverts')
    state.page.id = 'adverts'
  else if (hash == '#/feed')
    state.page.id = 'feed'
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

  // route logic
  if (state.page.id == 'inbox') {
    localStorage.readMessages = JSON.stringify(state.inbox)
  }
}