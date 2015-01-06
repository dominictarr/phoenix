var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')

module.exports = function(state) {
  var msgs = []
  for (var i=state.msgs.length-1; i>=0; i--) {
    if (state.msgs[i].repliesToLink)
      continue
    var m = com.messageSummary(state, state.msgs[i])
    if (m) msgs.push(m)
  }

  var content = [h('table.table.message-feed', msgs)]
  if (msgs.length === 0 || state.user.followers.length === 0) {
    var why = (msgs.length === 0) ? 'your feed is empty' : 'you have no followers'
    content = content.concat([
      h('hr'),
      h('p', h('strong', 'You must be new, because '+why+'!')),
      h('p', 
        'Let\'s fix that. Remember how, when facebook came out, you had to have a .edu to join? ',
        'Hah, screw that. Around here, you have to know a techie with a server to get connected.'
      ),
      h('p', 'You... do know a techie, right? Ask them for an invite code, then click ',
        h('button.btn.btn-xs.btn-primary.click-add-contact', 'Add contact'),
        ' and copy+paste it into the popup. The rest happens automatically.'
      ),
      h('p',
        h('strong', 'Techies. '),
        'You run this show. ',
        com.a('https://github.com/ssbc/scuttlebot#running-your-own-pub-server', 'Set up a pub server'),
        ' and keep out the trolls.'
      ),
      h('p', 'Enjoy!')
    ])
  }

  state.setPage(com.page(state, 'feed', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-8', content),
    h('.col-xs-2.col-md-3',
      com.adverts(state),
      h('hr'),
      com.sidehelp(state)
    )
  )))
}