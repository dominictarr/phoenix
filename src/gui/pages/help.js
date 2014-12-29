var h = require('hyperscript')
var com = require('../com')

module.exports = function(state) {
  var content
  if (state.page.param == 'networking') {
    content = [
      panel('Contacts', ['If you want to follow somebody and receive their broadcasts and messages, you have to add them as a contact. They\'ll have to do the same if they want to see your messages. ', h('strong', 'TODO: how to add contacts')]),
      panel('Pub Servers', 'Phoenix uses "pub servers" to get messages across the network. Pub servers are simplistic: all they do is receive your messages and host them for other people to fetch. Since they\'re on the public web and always on, they help the network stay available.'),
      panel('Sync', 'To get the latest messages, you need to ask the servers in your network for the latest (kind of like with email). This happens periodically in the background, but, if you want to force a sync, you can press the big Sync button in the top right.')
    ]
  } else if (state.page.param == 'privacy') {
    content = [
      panel('How Phoenix Works', 'Phoenix is built on a "distributed" messaging system, like email. Users and their messages are identified by unique, secure keys, allowing us to share messages between devices without relying on central servers.'),
      panel('Is it Private?', 'Phoenix v1 is only a public broadcast system, like Twitter. In future versions, we\'ll add encryption and direct messages so that you can share messages with individuals and groups.')
    ]
  } else {
    content = [
      panel('Basics', 'Phoenix v1 is a social feed application. You can broadcast to everyone following you, much like on Twitter. However, unlike Twitter, only people you are following can contact you. This means no unsolicited spam!'),
      panel('Replies', 'You can reply to other users with text posts and reactions. When you open a message\'s page, you\'ll see all of the replies in a threaded view, like a message-board. Click the age of a post (eg "5m", "yesterday") to get to its page.'),
      panel('Sharing', 'If you want to spread somebody\'s message, you can "share" it to your followers. This is just like retweeting, except, in the case of Phoenix, it\'s the ONLY way to spread a message. If somebody replies to you, your non-mutual followers will only see that reply if you share it.'),
      panel('Mentions', ['Like in most social networks, you can "@-mention" other users. If they follow you, or if somebody shares the message to them, they\'ll be notified of the mention. Check your ', com.a('#/inbox', 'Inbox'), ' to find your notifications.']),
      panel('Emojis', ['You can put emojis in your posts using colons. For instance, \':smile:\' will result in ', h('img.emoji', { src: '/img/emoji/smile.png', height: 20, width: 20}), '. Check the ', com.a('http://www.emoji-cheat-sheet.com/', 'Emoji Cheat Sheet'), ' to see what\'s available'])
    ]
  }

  state.setPage(com.page(state, 'help', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-7', content),
    h('.col-xs-3.col-md-4', h('ul.nav.nav-pills.nav-stacked', helpnav('#/help/'+state.page.param, [
      ['#/help/intro', 'Getting Started'],
      ['#/help/networking', 'Networking'],
      ['#/help/privacy', 'Privacy']
    ])))
  )))
}

function helpnav(current, items) {
  return items.map(function(item) {
    if (item[0] == current)
      return h('li.active', com.a(item[0], item[1]))
    return h('li', com.a(item[0], item[1]))
  })
}

function panel(title, content) {
  return h('.panel.panel-default', [
    h('.panel-heading', h('h3.panel-title', title)),
    h('.panel-body', content)
  ])
}