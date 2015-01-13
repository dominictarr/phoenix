var h = require('hyperscript')
var multicb = require('multicb')
var com = require('./index')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  var adspace = h('.adverts-but-its-cool-tho')
  var done = multicb({ pluck: 1 })
  app.ssb.phoenix.getNamesById(done())
  app.ssb.phoenix.getRandomAdverts(3, 30, done())
  done(function (err, data) {
    var names = data[0]
    var ads = data[1]
    if (ads.length)
      ads.forEach(function (ad) { adspace.appendChild(renderAd(app, ad, names)) })
    else
      adspace.appendChild(h('small', 'this space is reserved for user adverts - ', com.a('#/adverts', 'try it out!')))
  })
  return adspace
}

function renderAd (app, ad, names) {
  return h('div',
    h('small', 'advert by ', com.userlink(ad.value.author, names[ad.value.author])),
    h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.value.content.text)) })
  )
}