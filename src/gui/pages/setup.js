var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  state.setPage(com.page(state, 'setup', h('.row',
    h('.col-xs-12', [
      h('.jumbotron', [
        h('h1', 'Welcome to Secure Scuttlebutt'),
        h('p', [h('.btn.btn-primary.click-set-name', 'Click Here'), ' to set your nickname.'])
      ])
    ])
  )))
}