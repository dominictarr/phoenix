var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var msgs = []
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.page.feedMode == 'threaded') {
      if (state.msgs[i].repliesToLink)
        continue
      msgs.push(com.messageThread(state, state.msgs[i]))
    } else {
      msgs.push(com.message(state, state.msgs[i]))
    }
  }
  
  state.setPage(com.page(state, 'feed', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-10.col-sm-9.col-md-8.col-lg-7', 
      com.postForm(state),
      h('.message-feed', msgs)
    )
  )))
}