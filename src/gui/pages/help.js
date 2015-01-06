var h = require('hyperscript')
var com = require('../com')

module.exports = function(state) {
  var content
  if (state.page.param == 'apps') {
    content = [
      panel('Applications', [
        'Web applications can detect that you\'re running Scuttlebutt and ask for access. ',
        'This is a beta feature, so be careful who you give access to! ',
        'Once an app can write to your feed, it can post messages freely.', h('br'),
        h('br'),
        'It\'s recommended that only developers allow and use apps at this time.'
      ]),
      panel('Developers', 'If you want to write applications with Scuttlebutt, visit THIS DOCUMENTATION THAT DOESNT EXIST (TODO).'),
      panel('De-authorizing Apps', [
        'If you want to revoke access to Scuttlebutt, restart your ssb process. ',
        'App authorizations are only stored in memory, and so this will clear the permissions records.'
      ])
    ]
  } else if (state.page.param == 'networking') {
    content = [
      panel('Contacts', [
        'Scuttlebutt searches the network for messages from your contacts, plus messages from the people your contacts follow. ',
        'If you want to be sure you get a specific persons\'s messages, ', 
        h('button.btn.btn-xs.btn-primary.click-add-contact', 'Follow their contact id')
      ]),
      panel('Following Users', [
        'To follow somebody, find their profile page and hit the "Follow" button. ',
        'If you have their ID but not their profile page, you can hit ', 
        h('button.btn.btn-xs.btn-primary.click-add-contact', 'Add contact'), 
        ' on the top right and enter the ID in the popup.'
      ]),
      panel('Pub Servers', [
        'Scuttlebutt uses "pub servers" to get messages across the internet. ',
        'Pub servers are bots that receive your messages and host them for other people to fetch. ',
        'Since they\'re on the public web and always on, they help the network stay available.', h('br'), 
        h('br'),
        'You\'ll need to use a pub server if you want to reach people outside of your wifi.'
      ]),
      panel('Invite Codes', [
        'If someone you know is running a pub server, ask them for an invite code. ',
        'You can use the code by pasting it into the ', 
        h('button.btn.btn-xs.btn-primary.click-add-contact', 'Add contact'), 
        ' dialog, just like when following somebody.'
      ]),
      panel('Running a Pub Server', [
        'If you want to run your own pub server, ', 
        com.a('https://github.com/ssbc/scuttlebot#running-your-own-pub-server', 'follow the instructions in the scuttlebot repo'), 
        '. Note, this is for advanced users!'
      ])
    ]
  } else if (state.page.param == 'privacy') {
    content = [
      panel('Privacy in Secure Scuttlebutt', [
        'Secure Scuttlebutt is anti-spyware: it runs safely on your computer and denies unexpected traffic (eg to fetch images) so that people can\'t track your activity.', h('br'),
        h('br'),
        'That said, SSB is part of a network and it does emit information. This page will explain your footprint so you can know what you\'re telling the world.'
      ]),
      panel('Anonymity', [
        'Secure Scuttlebutt is a public global network. In this early state, it uses no encryption and does not try to hide your posts. In fact, it\'s working hard to get them out to the world!', h('br'),
        h('br'),
        'You don\'t have to give any personal information (like your real name) but it should be possible to figure out who you are based on your posts, your friends, and the names people give you. ',
        'Don\'t expect to be anonymous!'
      ]),
      panel('Am I Online? is Public', [
        'Secure Scuttlebutt connects to all the computers it knows about to syncronize with them - a process we call "gossiping." ',
        'The other computers can infer by the connections that your PC is online.', h('br'),
        h('br'),
        'You can see what computers your PC talks to in the ', com.a('#/network', 'rightmost column of the network page.')
      ]),
      panel('What Have I Posted? is Public', [
        'Posts, replies, and reactions are broadcasted publicly. ',
        'In the future, encryption will be added for private messages.'
      ]),
      panel('Who Do I Follow? and Who Follows Me? is Public', [
        'Follows and unfollows are broadcasted publicly.'
      ]),
      panel('What\'s My Username? is Public', [
        'Nicknames that you give yourself and others are broadcasted publicly.'
      ]),
      panel('What Pub-servers Do I Use? is Public', [
        'The addresses of your pub servers are broadcasted publicly.'
      ]),
      panel('What Isn\'t Public?', [
        'Here is what isn\'t shared by SSB but is frequently tracked by other web apps:', h('br'),
        h('br'),
        h('ul',
          h('li', 'When you\'re using the app.'),
          h('li', 'What pages and information you\'re reading or clicking on.'),
          h('li', 'What messages you started to type, but cancelled.'),
          h('li', 'What you search for.')
        )
      ]),
      panel('Is That All?', [
        'Secure Scuttlebutt is not just this app: it\'s a full database capable of any type of messaging you want. ',
        'Developers can use it to write their own applications. ', h('br'),
        h('br'),
        'This application usually ignores the messages by other apps, but, if you want to see them, click the down-arrow at the top right of the page and choose ',
        h('a.btn.btn-xs.btn-primary.click-set-render-mode', { href: '#', 'data-mode': 'rawcontent' }, "Raw Content."),
        ' Then you can browse the ', com.a('#/', 'feed page'), ' and see what\'s happening behind the scenes. ',
        '(That\'s everything there is!)'
      ])
    ]
  } else if (state.page.param == 'names') {
    content = [
      panel('What\'s with the Scare-Quotes Around Names?', [
        'You may have noticed quotes around people\'s names ("bob"). ',
        'This means you\'re seeing a name they gave themselves - not one you assigned.'
      ]),
      panel('Why Have the Quotes?', [
        'In Secure Scuttlebutt, anybody can claim a name, even if it\'s taken. ',
        'Yes, somebody else could use "', state.names[state.user.id], '"! ',
        'And that could confuse your friends.', h('br'),
        h('br'),
        'To protect everybody, we use the quotes to show it\'s a self-assigned name.'
      ]),
      panel('How Do I Get Rid of Them?', [
        'By assigning a name to that user. ',
        'Navigate to their profile and hit the "Give Nickname" button on the right. ',
        'Your UI will update with the new name (quotes removed) and your name-choice will be broadcast.'
      ]),
      panel('Should I Give Names to Everybody?', [
        'You can, but make sure you\'re giving the right name to the right people. ',
        'Names are not just for convenience here; they help people find each other. ',
        'The names you give will help people realize that a stranger is actually a mutual friend.', h('br'),
        h('br'),
        'If you\'re not sure the user is who you think it is, indicate that in the name. ',
        'Use "maybe-bob" instead of just "bob," for instance, then change it to just "bob" when you\'re sure it\'s him. ',
        'That\'ll be helpful for you and your friends.'
      ]),
      panel('How Can I See the Names Given to Another User?', [
        'Check the right hand side of their profile page. ',
        'You should see the names given and who gave them. ',
        'If you expect the user to be a mutual friend, but none of your friends have given them a name, then it\'s probably not who you think it is.'
      ]),
      panel('How Can I Be 100% Sure Who Someone Is?', [
        'Ask your friend to describe their Emoji footprint (right side of their profile). ',
        'Every footprint is unique, so, if it doesn\'t match, you have the wrong user.'
      ])
    ]
  } else if (state.page.param == 'adverts') {
    content = [
      panel('Wait, Advertisements?', [
        'The advertisements are placed by the users. ',
        'They\'re mostly for fun, but they can be useful too. ',
        'For instance, if you ever lose your dog, you can post an advert letting your friends know.'
      ]),
      panel('Which Ads Do I See?', [
        'Scuttlebutt rotates the last 30 adverts at random.',
      ]),
      panel('Do the Ads Track Me?', [
        'There\'s no tracking involved.'
      ])
    ]
  } else {
    content = [
      panel('Welcome', [
        'Secure Scuttlebutt is a free online network that runs on user devices. ',
        'That means there\'s no company running the show! ',
        'Your computers stay in sync automatically by connecting over the wifi and public web.',
        h('br'), h('br'),
        h('ul',
          h('li', h('strong', 'Anti-spyware:'), ' your browsing, personal data, and applications are not tracked.'),
          h('li', h('strong', 'Decentralized:'), ' the network is controlled by users, not a parent company.'),
          h('li', h('strong', 'Free as in Freedom:'), ' the source-code is on your computer and licensed for you to edit and share.')
        )
      ]),
      panel('Posts', [
        'Posts in Scuttlebutt are formatted in ', com.a('https://en.wikipedia.org/wiki/Markdown', 'Markdown'), 
        '. Hit the Preview button to see your message. ',
        'Be warned, once you press the "Post" button, there is no undo or delete!'
      ]),
      panel('Mentions', [
        'Like in most social networks, you can "@-mention" other users. ',
        'When they receive the message, they\'ll be notified of the mention. ',
        'Check your ', com.a('#/inbox', 'Inbox'), ' to find your notifications.'
      ]),
      panel('Emojis', [
        'You can put emojis in your posts using colons. ',
        'For instance, \':smile:\' will result in ', h('img.emoji', { src: '/img/emoji/smile.png', height: 20, width: 20}), 
        '. Check the ', com.a('http://www.emoji-cheat-sheet.com/', 'Emoji Cheat Sheet'), ' to see what\'s available.'
      ])
    ]
  }

  state.setPage(com.page(state, 'help', h('.row',
    h('.col-xs-2.col-md-1', com.sidenav(state)),
    h('.col-xs-7', content),
    h('.col-xs-3.col-md-4', 
      h('ul.nav.nav-pills.nav-stacked', helpnav('#/help/'+state.page.param, [
        ['#/help/intro', 'Getting Started'],
        ['#/help/networking', 'Connecting to People'],
        ['#/help/privacy', 'Privacy: Understand What\s Shared'],
        ['#/help/names', '"User Names"'],
        ['#/help/adverts', 'Wait, Advertisements?'],
        ['#/help/apps', '3rd-Party Apps']
      ])),
      h('hr'),
      com.sidehelp(state, {noMore: true})
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