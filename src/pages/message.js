'use strict'
var h = require('hyperscript')
var com = require('../com')
var util = require('../lib/util')

module.exports = function (app) {
  app.ssb.phoenix.getThread(app.page.param, function (err, thread) {
    var content
    if (thread) {
      content = com.messageThread(app, thread, { fullLength: true })
      app.ssb.phoenix.getPostParent(app.page.param, function (err, parent) {
        var summary
        if (parent) {
          var pauthor = (app.names[parent.value.author] || util.shortString(parent.value.author))
          if (parent.value.content.text)
            summary = '^ ' + pauthor + ': "' + util.shortString(parent.value.content.text, 100) + '"'
          else
            summary = '^ '+parent.value.content.type+' message by ' + pauthor
        } else {
          summary = '^ parent message not yet received (' + thread.parent + ')'
        }
        content.querySelector('.in-response-to').appendChild(com.a('#/msg/'+thread.parent, summary))
      })
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