var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')
var mdcheatsheet = require('./markdown-cheatsheet.md')

module.exports = function(state) {
  state.setPage(com.page(state, 'message', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8',
      com.postForm(state)
      // h('div', { innerHTML: markdown.block(mdcheatsheet, false, false) })
    ),
    h('.col-xs-2.col-md-3',
      com.adverts(state),
      h('hr'),
      com.sidehelp()
    )
  )))
}