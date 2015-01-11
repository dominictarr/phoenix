var h = require('hyperscript')
var com = require('./index')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  var adspace = h('.adverts-but-its-cool-tho')
  app.api.getRandomAdverts(3, 30, function (err, ads) {
    if (ads.length)
      ads.forEach(function (ad) { adspace.appendChild(renderAd(app, ad)) })
    else
      adspace.appendChild(h('small', 'this space is reserved for user adverts - ', com.a('#/adverts', 'try it out!')))
  })
  return adspace
}

function renderAd (app, ad) {
  return h('div',
    h('small', 'advert by ', com.userlink(ad.value.author, app.api.getNameById(ad.value.author))),
    h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.value.content.text)) })
  )
}