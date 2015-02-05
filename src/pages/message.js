'use strict'
var h = require('hyperscript')
var mlib = require('ssb-msgs')
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
      var plink = mlib.getLinks(thread.value.content, { tomsg: true, rel: 'replies-to' })[0]
      if (plink) {
        app.ssb.get(plink.msg, function (err, parent) {
          var summary
          if (parent) {
            var pauthor = (app.names[parent.author] || util.shortString(parent.author))
            if (parent.content.text)
              summary = '^ ' + pauthor + ': "' + util.shortString(parent.content.text, 100) + '"'
            else
              summary = '^ '+parent.content.type+' message by ' + pauthor
          } else {
            summary = '^ parent message not yet received (' + plink.msg + ')'
          }
          content.querySelector('.in-response-to').appendChild(com.a('#/msg/'+plink.msg, summary))
        })
      }
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
