var h = require('hyperscript')
var com = require('../com')

module.exports = function(state) {
  var content
  if (state.page.param == 'apps') {
    content = [
      panel('Applications', 'Web applications can detect that you\'re running Scuttlebutt and ask for access. This is a beta feature, so be careful who you give access to! Once an app can read or write to your feed, it can post messages freely. (It\'s recommended that only developers use apps at this time.)'),
      panel('Developers', 'If you want to write applications with Scuttlebutt, visit THIS DOCUMENTATION THAT DOESNT EXIST (TODO).'),
      panel('De-authorizing Apps', 'If you want to revoke access to Scuttlebutt, restart your ssb process. App authorizations are only stored in memory, and so this will clear the permissions records.')
    ]
  } else if (state.page.param == 'networking') {
    content = [
      panel('Contacts', ['Scuttlebutt searches the network for messages from your contacts, plus messages from the people your contacts follow. If you want to be sure you get a specific persons\'s messages, ', h('button.btn.btn-xs.btn-default.click-add-contact', 'Follow their contact id')]),
      panel('Following Users', ['To follow somebody, find their profile page and hit the "Follow" button. If you have their ID, but not their profile page, you can hit ', h('button.btn.btn-xs.btn-default.click-add-contact', 'Add contact'), ' on the top right and enter the ID in the popup.']),
      panel('Pub Servers', ['Scuttlebutt uses "pub servers" to get messages across the internet. Pub servers are bots that receive your messages and host them for other people to fetch. Since they\'re on the public web and always on, they help the network stay available.', h('br'), h('br'), 'You\'ll need to use a pub server if you want to reach people outside of your wifi.']),
      panel('Invite Codes', ['If someone you know is running a pub server, ask them for an invite code. You can use the code by pasting it into the ', h('button.btn.btn-xs.btn-default.click-add-contact', 'Add contact'), ' dialog, just like when following somebody.']),
      panel('Running a Pub Server', ['If you want to run your own pub server, ', com.a('https://github.com/ssbc/scuttlebot#running-your-own-pub-server', 'follow the instructions in the scuttlebot repo'), '. Note, this is for advanced users.'])
    ]
  } else {
    content = [
      panel('Basics', 'Secure Scuttlebutt is a free online network that runs on user devices. That means there\'s no company running the show! Your computers stay in sync automatically by connecting over the wifi and public web.'),
      panel('So what?', ['Secure Scuttlebutt doesn\'t track your browsing or wall away your data. ', com.a('#/help/apps', 'It\'s easy to build new apps on your feed.'), ' When encryption support lands, you\'ll be able to write private messages that are only visible to the recipients. This is a powerful tool for personal freedom and privacy.']),
      panel('Posts', ['Posts in Scuttlebot are formatted in ', com.a('https://en.wikipedia.org/wiki/Markdown', 'Markdown'), '. Hit the Preview button to see your message. Be warned, once you press the "Post" button, there is no undo or delete!']),
      panel('Mentions', ['Like in most social networks, you can "@-mention" other users. When they receive the message, they\'ll be notified of the mention. Check your ', com.a('#/inbox', 'Inbox'), ' to find your notifications.']),
      panel('Emojis', ['You can put emojis in your posts using colons. For instance, \':smile:\' will result in ', h('img.emoji', { src: '/img/emoji/smile.png', height: 20, width: 20}), '. Check the ', com.a('http://www.emoji-cheat-sheet.com/', 'Emoji Cheat Sheet'), ' to see what\'s available'])
    ]
  }

  state.setPage(com.page(state, 'help', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-7', content),
    h('.col-xs-3.col-md-4', 
      h('ul.nav.nav-pills.nav-stacked', helpnav('#/help/'+state.page.param, [
        ['#/help/intro', 'Getting Started'],
        ['#/help/networking', 'Connecting to People'],
        ['#/help/apps', '3rd-Party Apps']
      ])),
      h('hr'),
      com.sidehelp()
    )
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