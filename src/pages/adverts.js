'use strict'
var h = require('hyperscript')
var multicb = require('multicb')
var com = require('../com')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  var opts = { start: 0 }
  app.ssb.phoenix.getAdverts(opts, function (err, adverts) {

    // markup 

    var content = h('div', adverts.map(renderAd))

    var loadMoreBtn = (adverts.length === 30) ? h('p', h('button.btn.btn-primary.btn-block', { onclick: loadMore }, 'Load More')) : ''
    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-11', 
        com.advertForm(app),
        h('hr'),
        h('.row', content),
        h('.row',
          h('.col-xs-3',
            h('.well.well-sm', 'Create ads to let your friends know about events, websites, etc. ', com.a('#/help/adverts', 'About'))
          )
        ),
        loadMoreBtn
      )
    ))

    function renderAd (ad) {
      if (ad.value) {
        var author = ad.value.author
        return h('.col-xs-2',
          h('small', 'advert by ', com.userlink(author, app.names[author])),
          h('.well.well-sm', { innerHTML: markdown.block(ad.value.content.text) })
        )
      }
    }

    // handlers

    function loadMore (e) {
      e.preventDefault()
      opts.start += 30
      app.ssb.getAdverts(opts, function (err, moreAdverts) {
        if (moreAdverts.length > 0) {
          moreAdverts.forEach(function (ad) { 
            var el = renderAd(ad)
            if (el) content.appendChild(el)
          })
        }
        // remove load more btn if it looks like there arent any more to load
        if (moreAdverts.length < 30)
          loadMoreBtn.parentNode.removeChild(loadMoreBtn)
      })
    }
  })
}