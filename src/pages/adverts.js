var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  app.api.getAdverts({ start: 0, end: 30 }, function (err, adverts) {
    adverts = adverts.map(function (ad) {
      var author = ad.value.author
      return h('.col-xs-3',
        h('small', 'advert by ', com.userlink(author, app.api.getNameById(author))),
        h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.value.content.text), app.api.getNames()) })
      )
    })

    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-11', 
        com.advertForm(app),
        h('hr'),
        h('.row', adverts),
        h('p.text-muted', {style:'padding-left:10px'}, 
          'Create ads to let your friends know about events, websites, etc. ',
          com.a('#/help/adverts', 'About')
        )
      )
    ))
  })
}