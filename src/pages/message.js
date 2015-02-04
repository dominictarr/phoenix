'use strict'
var h = require('hyperscript')
var com = require('../com')
var util = require('../lib/util')

module.exports = function (app) {
  app.ssb.relatedMessages({
    id: app.page.param, rel: 'replies-to',
    count: true, parent: true
  }, function (err, thread) {
    var content
    if (thread) {
      content = com.messageThread(app, thread, { fullLength: true })
      try {
        var pkey = thread.value.content.repliesTo.msg
        app.ssb.get(pkey, function (err, parent) {
          if (parent) {
            var pauthor = parent.author
            var header = content.querySelector('.panel-heading .in-response-to')
            header.appendChild(h('span', {innerHTML: ' &middot; in response to '}))
            header.appendChild(com.a('#/msg/'+pkey, 'a post by ' + (app.names[pauthor] || util.shortString(pauthor))))
          }
        })
      }
      catch (_) {}
    } else {
      content = 'Message not found.'
    }

    app.setPage('message', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-9', content),
      h('.hidden-xs.hidden-sm.col-md-2',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
  })
}
