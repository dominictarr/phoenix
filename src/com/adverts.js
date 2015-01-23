'use strict'
var h = require('hyperscript')
var com = require('./index')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

module.exports = function (app) {
  var adspace = h('.adverts-but-its-cool-tho')
  app.ssb.phoenix.getRandomAdverts(3, 30, function (err, ads) {
    if (ads.length)
      ads.forEach(function (ad) { adspace.appendChild(renderAd(app, ad)) })
    else
      adspace.appendChild(h('.well.well-sm', com.a('#/adverts', 'Create ads'), ' to let your friends know about events, websites, etc. ', com.a('#/help/adverts', 'About')))
  })
  return adspace
}

function renderAd (app, ad) {
  return h('div',
    h('small', 'advert by ', com.userlink(ad.value.author, app.names[ad.value.author])),
    h('.well.well-sm', { innerHTML: markdown.block(ad.value.content.text) })
  )
}