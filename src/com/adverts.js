var h = require('hyperscript')
var com = require('./index')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function (app) {
  var adspace = h('.adverts-but-its-cool-tho')
  app.api.getRandomAdverts(3, 30, function (err, ads) {
    if (ads.length)
      adspace.appendChild(ads.map(renderAd.bind(null, app)))
    else
      adspace.appendChild(h('small', 'this space is reserved for user adverts - ', com.a('#/adverts', 'try it out!')))
  })
}

function renderAd (app, ad) {
  return [
    h('small', 'advert by ', com.userlink(ad.value.author, app.getNameById(ad.value.author))),
    h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.markdown)) })
  ]
}