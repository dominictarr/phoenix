var h = require('hyperscript')
var com = require('../com')

module.exports = function (app) {
  var content
  if (app.page.param == 'apps') {
    content = [
      com.panel('Applications', [
        'Web applications can detect that you\'re running Scuttlebutt and ask for access. ',
        'This is a beta feature, so be careful who you give access to! ',
        'Once an app can write to your feed, it can post messages freely.', h('br'),
        h('br'),
        'It\'s recommended that only developers allow and use apps at this time.'
      ]),
      com.panel('Developers', 'If you want to write applications with Scuttlebutt, visit THIS DOCUMENTATION THAT DOESNT EXIST (TODO).'),
      com.panel('De-authorizing Apps', [
        'If you want to revoke access to Scuttlebutt, restart your ssb process. ',
        'App authorizations are only stored in memory, and so this will clear the permissions records.'
      ])
    ]
  } else if (app.page.param == 'posts') {
    content = [
      com.panel('Posts', [
        'Posts in Secure Scuttlebutt are public and readable by anybody that follows your feed.',
        h('br'), h('br'),
        'Take care! There is currently no undo or delete.'
      ]),
      com.panel('Mentions', [
        'Posts can "@-mention" users. ',
        'Check your ', com.a('#/inbox', 'Inbox'), ' to find messages that mention you.',
         h('.text-muted', { style: 'padding: 20px; padding-bottom: 10px' }, 'eg "Hello ', com.userlink(app.myid, '@'+app.names[app.myid]), '!"')
      ]),
      com.panel('Emojis', [
        'Emojis are written as words surrounded by colons. ',
        'Check the ', com.a('http://www.emoji-cheat-sheet.com/', 'Emoji Cheat Sheet'), ' to see what\'s available.',
         h('.text-muted', { style: 'padding: 20px; padding-bottom: 10px' }, 'eg ":smile:" = ', h('img.emoji', { src: '/img/emoji/smile.png', height: 20, width: 20})) 
      ])
    ]
  } else if (app.page.param == 'contacts') {
    content = [
      com.panel('Contacts', [
        'Scuttlebutt searches the network for messages from your contacts. ',
        h('button.btn.btn-primary', { onclick: app.followPrompt }, 'Add a contact')
      ]),
      com.panel('User IDs', [
        'User IDs are generated with cryptography so that they are globally unique. ',
        'Specifically, they are ',
        com.a('https://en.wikipedia.org/wiki/Base64', 'base64'),'-encoded ',
        com.a('https://blake2.net/', 'blake2s'),' hashes of public ',
        com.a('https://en.wikipedia.org/wiki/Elliptic_curve_cryptography', 'elliptic-curve'), ' keys.'
      ]),
      com.panel('Your ID:', app.myid)
    ]
  } else if (app.page.param == 'pubs') {
    content = [
      com.panel('Pub Servers', [
        'Pub servers are bots that host your messages for other people to download. ',
        'Since they\'re on the public web and always online, they help the network stay available.', h('br'), 
        h('br'),
        'You\'ll need to use a pub server if you want to reach people outside of your wifi.'
      ]),
      com.panel('Invite Codes', [
        'If someone you know is running a pub server, ask them for an invite code. ',
        'You can use the code by pasting it into the ', 
        h('button.btn.btn-xs.btn-primary', { onclick: app.followPrompt }, 'Use an invite'), 
        ' dialog.'
      ]),
      com.panel(['Running a Pub Server ', h('small.text-muted', 'advanced')], [
        'If you want to run your own pub server, ', 
        com.a('https://github.com/ssbc/scuttlebot#running-your-own-pub-server', 'follow the instructions in the scuttlebot repo'),
        '.'
      ])
    ]
  } else if (app.page.param == 'privacy') {
    content = [
      com.panel('Privacy in Secure Scuttlebutt', [
        'Secure Scuttlebutt is anti-spyware: it runs on your computer and keeps your personal data private.', h('br'),
        h('br'),
        'That said, SSB is part of a network and it does emit information. This page will explain your footprint so you can know what you\'re telling the world.'
      ]),
      com.panel('Anonymity', [
        'Secure Scuttlebutt is a public global network. In this current version, all posts are public.', h('br'),
        h('br'),
        'You don\'t have to give any personal information (like your real name) but it should be possible to figure out who you are based on your posts, your friends, and the names people give you. ',
        'Don\'t expect to be anonymous!'
      ]),
      com.panel('Am I Online? is Public', [
        'Secure Scuttlebutt connects to all the computers it knows about to syncronize with them - a process we call "gossiping." ',
        'The other computers can infer by the connections that your PC is online.', h('br'),
        h('br'),
        'You can see what computers your PC talks to in the ', com.a('#/network', 'rightmost column of the network page.')
      ]),
      com.panel('What Have I Posted? is Public', [
        'Posts and replies are broadcasted publicly.',
      ]),
      com.panel('Who Do I Follow? and Who Follows Me? is Public', [
        'Follows and unfollows are broadcasted publicly.'
      ]),
      com.panel('Who Do I Trust or Distrust? is Public', [
        'Trusts and flags are broadcasted publicly.'
      ]),
      com.panel('What\'s My Username? is Public', [
        'Nicknames that you give yourself and others are broadcasted publicly.'
      ]),
      com.panel('What Pub-servers Do I Use? is Public', [
        'The addresses of your pub servers are broadcasted publicly.'
      ]),
      com.panel('What Isn\'t Public?', [
        'Here is what isn\'t shared by SSB but is frequently tracked by other web apps:', h('br'),
        h('br'),
        h('ul',
          h('li', 'When you\'re using the app.'),
          h('li', 'What pages and information you\'re reading or clicking on.'),
          h('li', 'What messages you started to type, but cancelled.'),
          h('li', 'What you search for.')
        )
      ]),
      com.panel('Is That All?', [
        'Secure Scuttlebutt is not just this app: it\'s a full database capable of any type of messaging you want. ',
        'Developers can use it to write their own applications. ', h('br'),
        h('br'),
        'This application usually ignores the messages by other apps, but, if you want to see them, browse to the ', com.a('#/feed', 'data feed'), ' and see what\'s happening behind the scenes. ',
        '(That\'s everything there is!)'
      ])
    ]
  } else if (app.page.param == 'names') {
    content = [
      com.panel('Quoted Names (eg "bob")', [
        'Quotes around a name means you\'re seeing the name the user chose, not one you assigned.'
      ]),
      com.panel('Conflicting Names', [
        'Names are not unique in Secure Scuttlebutt. ',
        '(Somebody else could use "', app.names[app.myid], '.")'
      ]),
      com.panel('Assigning Names', [
        'Open your ', com.a('#/address-book', 'address book'), ' and click the pencil next to somebody\'s name to change it.'
      ])
    ]
  } else if (app.page.param == 'trust') {
    content = [
      com.panel('Trust', [
        'In Secure Scuttlebutt, there\'s no central authority, so you have to appoint other people to be trusted.', h('br'),
        h('br'),
        'You can appoint somebody as "trusted" by opening their profile page and clicking the Trust button.',
      ]),
      com.panel('Effects of Trust', [
        'Trusting somebody currently does the following:', h('br'),
        h('br'),
        h('ul', 
          h('li', 'Broadcasts your trust in that user.'),
          h('li', 'Tells Secure Scuttlebutt to use the names given by that user.')
        )
      ]),
      com.panel('Verifying Identity', [
        'To make sure you\'re trusting the right account, call your friend and read them the "Emoji Fingerprint" on the right side of their profile. ',
        'If the fingerprint matches, then you have the right account.'
      ]),
      com.panel('Flagging', [
        'If somebody is behaving poorly (spamming, trolling) you can flag their account to signal to other users that they should be avoided.'
      ])
    ]
  } else if (app.page.param == 'adverts') {
    content = [
      com.panel('Advertisements', [
        'Advertisements are placed by the users. ',
        'They\'re mostly for fun, but they can be useful too.',
      ]),
      com.panel('Which Ads Do I See?', [
        'Scuttlebutt rotates the last 30 adverts at random.',
      ]),
      com.panel('Do the Ads Track Me?', [
        'There\'s no tracking involved or allowed.'
      ])
    ]
  } else {
    content = [
      com.panel('About', [
        'Secure Scuttlebutt is a network for users, by users.',
        h('br'), h('br'),
        h('ul',
          h('li', h('strong', 'Anti-spyware:'), ' your browsing habits are never tracked.'),
          h('li', h('strong', 'Decentralized:'), '  you sync over wifi and with "pub" servers.'),
          h('li', h('strong', 'Open-source:'), ' the code is on your computer and ready to edit.')
        )
      ]),
      com.panel('Links', [
      h('ul.list-unstyled', 
        h('li', com.a('https://github.com/ssbc/scuttlebot', 'Main Repository'), ' - find the source-code here.'),
        h('li', com.a('https://github.com/ssbc', 'Organization on GitHub'), ' - find related code packages here.'),
        h('li', com.a('https://github.com/ssbc/scuttlebot/issues', 'Bug Tracker'), ' - file issues here.'),
        h('hr'),
        h('li', com.a('https://twitter.com/pfrazee', '@pfrazee'), ' - send money, compliments, and marriage proposals here.'),
        h('li', com.a('https://twitter.com/dominictarr', '@dominictarr'), ' - receive cyber-wizardry here.')
      )])
    ]
  }

  app.setPage('help', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(app)),
    h('.col-xs-7', content),
    h('.col-xs-3.col-md-4', 
      h('ul.nav.nav-pills.nav-stacked', helpnav('#/help/'+(app.page.param||'intro'), [
        ['#/help/intro', 'About'],
        ['#/help/posts', 'Posts'],
        ['#/help/contacts', 'Contacts'],
        ['#/help/names', 'User Names'],
        ['#/help/trust', 'Trust and Flagging'],
        ['#/help/pubs', 'Pub Servers'],
        ['#/help/adverts', 'Advertisements'],
        ['#/help/privacy', 'Privacy']
        // ['#/help/apps', '3rd-Party Apps'] :TODO: document?
      ])),
      h('hr'),
      com.sidehelp(app, {noMore: true})
    )
  ))
}

function helpnav (current, items) {
  return items.map(function(item) {
    if (item[0] == current)
      return h('li.active', com.a(item[0], item[1]))
    return h('li', com.a(item[0], item[1]))
  })
}