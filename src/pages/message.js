var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../lib/util')

module.exports = function (app) {
  app.ssb.phoenix.getThread(app.page.param, function (err, thread) {
    var content
    if (thread) {
      content = com.messageThread(app, thread, { fullLength: true })
      app.ssb.phoenix.getPostParent(app.page.param, function (err, parent) {
        if (parent) {
          var pauthor = parent.value.author
          var header = content.querySelector('.panel-heading .in-response-to')
          header.appendChild(h('span', {innerHTML: ' &middot; in response to '}))
          header.appendChild(com.a('#/msg/'+parent.key, 'a post by ' + (app.names[pauthor] || util.shortString(pauthor))))
        }
      })
    } else {
      content = 'Message not found.'
    }

    app.setPage('message', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-8', content),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
  })
}