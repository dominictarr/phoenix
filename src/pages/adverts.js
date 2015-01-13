var h = require('hyperscript')
var pull = require('pull-stream')
var multicb = require('multicb')
var com = require('../com')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  var opts = { start: 0 }
  var done = multicb()
  app.ssb.phoenix.getAdverts(opts, function (err, adverts) {

    // markup 

    var content = h('div', adverts.map(renderAd))

    var loadMoreBtn = (adverts.length === 30) ? h('p', h('button.btn.btn-primary', { onclick: loadMore }, 'Load More')) : ''
    app.setPage('feed', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-11', 
        com.advertForm(app),
        h('hr'),
        h('.row', content),
        loadMoreBtn,
        h('hr'),
        h('p.text-muted', {style:'padding-left:10px'}, 
          'Create ads to let your friends know about events, websites, etc. ',
          com.a('#/help/adverts', 'About')
        )
      )
    ))

    function renderAd (ad) {
      var author = ad.value.author
      return h('.col-xs-3',
        h('small', 'advert by ', com.userlink(author, app.names[author])),
        h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.value.content.text), app.names) })
      )
    }

    // handlers

    function loadMore (e) {
      e.preventDefault()
      opts.start += 30
      app.ssb.getAdverts(opts, function (err, moreAdverts) {
        if (moreAdverts.length > 0) {
          moreAdverts.forEach(function (ad) { content.appendChild(renderAd(ad)) })
        }
        // remove load more btn if it looks like there arent any more to load
        if (moreAdverts.length < 30)
          loadMoreBtn.parentNode.removeChild(loadMoreBtn)
      })
    }
  })
}