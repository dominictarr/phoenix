var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function (app) {
  app.getThread(app.page.param, function (err, thread) {
    var content
    if (thread) {
      content = com.messageThread(app, thread, { fullLength: true })
    } else {
      content = 'Message not found.'
    }

    app.setPage(com.page(app, 'message', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8',
        content
      ),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    )))
  })
}