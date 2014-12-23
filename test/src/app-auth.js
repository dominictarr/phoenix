var ssb = require('../../src/lib/ssb-client')()
var loginBtn = document.getElementById('loginbtn')
var logoutBtn = document.getElementById('logoutbtn')

ssb.connect()
ssb.on('socket:connect', function() {
  console.log('Connected')
})
ssb.on('socket:reconnecting', function() {
  console.log('Reconnecting')
})
ssb.on('socket:error', function() {
  console.log('Connection failed')
})
ssb.on('perms:granted', function() {
  console.log('Auth granted')
  ssb.connect()
})
ssb.on('perms:authed', function() {
  console.log('Auth suceeded')
  loginBtn.setAttribute('disabled', true)
  logoutBtn.removeAttribute('disabled')

  // :TODO: this should include a challenge for the server to sign, proving ownership of the keypair
  ssb.whoami(function(err, id) {
    console.log('whoami', err, id)
  })
})
ssb.on('perms:error', function() {
  console.log('Auth failed')
  loginBtn.removeAttribute('disabled')
  logoutBtn.setAttribute('disabled', true)
})

loginBtn.onclick = function(e){
  e.preventDefault()
  ssb.openAuthPopup({
    title: '3rd-party App Auth Test',
    perms: ['whoami', 'add', 'messagesByType', 'createLogStream']
  })
}
logoutBtn.onclick = function(e){
  e.preventDefault()
  ssb.deauth()
  ssb.close()
  loginBtn.removeAttribute('disabled')
  logoutBtn.setAttribute('disabled', true)
}