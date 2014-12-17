var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var content = com.page(state, 'feed', h('.row',
    h('.col-xs-1', com.sidenav(state)),
    h('.col-xs-7', 
      com.postForm(state),
      h('.message-feed', state.msgs.map(function(msg) {
        return com.message(state, msg)
      }))
    )
  ))

  document.body.innerHTML = ''
  document.body.appendChild(content)
}