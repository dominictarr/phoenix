var h = require('hyperscript')
var com = require('./index')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function(state) {
  var ads = []
  for (var i=0; i < 2 && i < state.adverts.length; i++) {
    var index = state.adverts.length - (Math.random()*Math.min(state.adverts.length, 30))|0
    ads.push(state.msgsById[state.adverts[index]])
  }
  if (ads.length)
    ads = ads.map(renderAd.bind(null, state))
  else
    ads = h('small', 'this space is reserved for user adverts - try it out!')
  return h('.adverts-but-its-cool-tho', ads)
}

function renderAd(state, ad) {
  return [
    h('small', 'advert by ', com.userlink(ad.value.author, state.names[ad.value.author])),
    h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.value.content.text), state.names) })
  ]
}