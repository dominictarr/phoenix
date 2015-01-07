var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../../lib/util')
var markdown = require('../../lib/markdown')

module.exports = function(state) {
  var ads = []
  for (var i=state.adverts.length-1, j=0; i>=0 && j<30; i--, j++) {
    var ad = state.msgsById[state.adverts[i]]
    ads.push(h('.col-xs-3',
      h('small', 'advert by ', com.userlink(ad.value.author, state.names[ad.value.author])),
      h('.well.well-sm', { innerHTML: markdown.block(util.escapePlain(ad.markdown), state.names) })
    ))
  }

  state.setPage(com.page(state, 'feed', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-10.col-md-11', 
      com.advertForm(state),
      h('hr'),
      h('.row', ads),
      h('p.text-muted', {style:'padding-left:10px'}, 
        'Create ads to let your friends know about events, websites, etc. ',
        com.a('#/help/adverts', 'About')
      )
    )
    // h('.col-xs-2.col-md-3',
    //   com.sidehelp()
    // )
  )))
}