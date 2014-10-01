var mercury = require('mercury')
var h = require('mercury').h
var util = require('../../../lib/util')

module.exports = render

// Layout
// ======

function render(state) {
  var page
  if (state.route == 'network') {
    page = networkPage(state)
  } else if (state.route.indexOf('profile/') === 0) {
    var profid = state.route.slice(8)
    page = profilePage(state, profid)
  } else {
    page = feedPage(state)
  }

  return h('.homeapp.container', { 'style': { 'visibility': 'hidden' } }, [
    stylesheet('/css/home.css'),
    mercury.partial(header, state.currentUserId),
    page
  ])
}

// Common Components
// =================

function header(currentUserId) {
  var sep = function() { return h('small', ' / ') }
  return h('.nav-header', [
    h('strong', 'phoenix'),
    sep(), a('#/', 'latest'),
    sep(), a('#/profile/' + currentUserId, 'profile'),
    sep(), a('#/network', 'network'),
    a('#/profile/' + currentUserId + '/intro-token', 'your intro token', { className: 'pull-right' })
  ])
}

function notfound(what, suggestion) {
  return h('div', [
    h('h3', 'Sorry, '+what+' was not found.' + (suggestion || '')),
    h('p', h('small', 'here\'s a cuddly kitty to help you through this trying time')),
    randomcat()
  ])
}

var cats = ['goingdown', 'hophop', 'huuhuuu', 'pillow-spin', 'shred', 'tailbites', 'woahwoah']
function randomcat() {
  var cat = cats[Math.round(Math.random() * 7)] || cats[0]
  return img('/img/loading/'+cat+'.gif')
}

function mascot(quote) {
  return h('.class', [
    img('/img/logo.png'),
    h('strong', [h('small', quote)])
  ])
}

function feed(feed) {
  return h('table.feed', feed.map(message).reverse())
}

function message(msg) {
  var content;
  switch (msg.type.toString()) {
    case 'init': content = h('strong', h('small', 'Account created')); break
    case 'text': content = util.escapePlain(msg.message.plain); break
    case 'profile': content = h('strong', h('small', 'Is now known as ' + util.escapePlain(msg.message.nickname))); break
    default: content = h('em', 'Unknown message type: ' + util.escapePlain(msg.type.toString())); break
  }

  return h('tr', [
    h('td.content', [
      h('p', [h('strong', util.escapePlain(msg.authorNickname)), h('small', util.prettydate(new Date(msg.timestamp)))]),
      h('p', content)
    ])
  ])
}

// Feed Page
// =========

function feedPage(state) {
  return h('.feed-page.row', [
    h('.col-xs-8', [feed(state.feed), mercury.partial(mascot, 'Dont let life get you down!')]),
    h('.col-xs-4', [mercury.partial(feedControls, state.lastSync), mercury.partial(profileLinks, state.profiles)])
  ])
}

function feedControls(lastSync) {
  return h('.feed-ctrls', [
    h('form.feed-publish', [
      h('div', h('textarea.form-control', { name: 'plain', placeholder: 'Publish...', rows: 1 })),
      h('button.btn.btn-default', 'Post')
    ]),
    h('p', 'Last synced '+lastSync),
    h('p', [h('button.btn.btn-default', 'Sync'), h('button.btn.btn-default', 'Add feed...')])
  ])
}

function profileLinks(profiles) {
  return h('div', profiles.map(profileLink))
}

function profileLink(profile) {
  return h('div', a('/#/profile/'+profile.id.toString('hex'), profile.nickname))
}

// Profile Page
// ============

function profilePage(state, profid) {
  var profi = state.profileMap[profid]
  var profile = (typeof profi != 'undefined') ? state.profiles[profi] : undefined
  if (!profile) {
    return h('.profile-page.row', [
      h('.col-xs-8', [notfound('that user')])
    ])
  }
  return h('.profile-page.row', [
    h('.col-xs-8', [feed(profile.feed), mercury.partial(mascot, 'Is it hot in here?')]),
    h('.col-xs-4', [mercury.partial(profileControls, profile)])
  ])
}

function profileControls(profile) {
  var followBtn = h('button.btn.btn-default', 'Follow')
  return h('.profile-ctrls', [
    h('h2', profile.nickname),
    h('h3', h('small', 'joined '+profile.joinDate)),
    h('p', followBtn),
    h('p', a('/profile/'+profile.id+'/intro-token', 'Intro Token'))
  ])
}

// Network Page
// ============

function networkPage(state) {
  return h('.network-page.row', [
    h('.col-xs-8', [pubservers(state.servers), mercury.partial(mascot, 'Who\'s cooking chicken?')]),
    h('.col-xs-4', [mercury.partial(networkControls, state.lastSync)])
  ])
}

function pubservers(servers) {
  return h('table.servers', servers.map(server))
}

function server(server) {
  return h('tr', [
    h('td.content', [
      h('h3', a(server.url, server.hostname)),
      h('p', h('button.btn.btn-default', 'Remove'))
    ])
  ])
}

function networkControls(lastSync) {
  return h('.network-ctrls', [
    h('p', 'Last synced '+lastSync),
    h('p', [h('button.btn.btn-default', 'Sync'), h('button.btn.btn-default', 'Add host...')])
  ])
}

// Helpers
// =======

function stylesheet(href) {
  return h('link', { rel: 'stylesheet', href: href })
}
function a(href, text, opts) {
  opts = opts || {}
  opts.href = href
  return h('a', opts, text)
}
function img(src) {
  return h('img', { src: src })
}

// Reference :TODO: remove
// =======================
/*
function header(field, events) {
  return h('header#header.header', {
    'ev-event': [
      mercury.changeEvent(events.setTodoField),
      mercury.submitEvent(events.add)
    ]
  }, [
    h('h1', 'Todos'),
    h('input#new-todo.new-todo', {
      placeholder: 'What needs to be done?',
      autofocus: true,
      value: field.text,
      name: 'newTodo'
    })
  ])
}

function mainSection(todos, route, events) {
  var allCompleted = todos.every(function (todo) {
    return todo.completed
  })
  var visibleTodos = todos.filter(function (todo) {
    return route === 'completed' && todo.completed ||
      route === 'active' && !todo.completed ||
      route === 'all'
  })

  return h('section#main.main', { hidden: !todos.length }, [
    h('input#toggle-all.toggle-all', {
      type: 'checkbox',
      name: 'toggle',
      checked: allCompleted,
      'ev-change': mercury.valueEvent(events.toggleAll)
    }),
    h('label', { htmlFor: 'toggle-all' }, 'Mark all as complete'),
    h('ul#todo-list.todolist', visibleTodos.map(function (todo) {
      return todoItem(todo, events)
    }))
  ])
}

function todoItem(todo, events) {
  var className = (todo.completed ? 'completed ' : ') +
    (todo.editing ? 'editing' : ')

  return h('li', { className: className, key: todo.id }, [
    h('.view', [
      h('input.toggle', {
        type: 'checkbox',
        checked: todo.completed,
        'ev-change': mercury.event(events.toggle, {
          id: todo.id,
          completed: !todo.completed
        })
      }),
      h('label', {
        'ev-dblclick': mercury.event(events.startEdit, {
          id: todo.id 
        })
      }, todo.title),
      h('button.destroy', {
        'ev-click': mercury.event(events.destroy, { id: todo.id })
      })
    ]),
    h('input.edit', {
      value: todo.title,
      name: 'title',
      // when we need an RPC invocation we add a 
      // custom mutable operation into the tree to be
      // invoked at patch time
      'ev-focus': todo.editing ? doMutableFocus() : null,
      'ev-keydown': mercury.keyEvent(events.cancelEdit, ESCAPE, {
        id: todo.id
      }),
      'ev-event': mercury.submitEvent(events.finishEdit, {
        id: todo.id
      }),
      'ev-blur': mercury.valueEvent(events.finishEdit, { id: todo.id })
    })
  ])
}

function statsSection(todos, route, events) {
  var todosLeft = todos.filter(function (todo) {
    return !todo.completed
  }).length
  var todosCompleted = todos.length - todosLeft

  return h('footer#footer.footer', { hidden: !todos.length }, [
    h('span#todo-count.todo-count', [
      h('strong', String(todosLeft)),
      todosLeft === 1 ? ' item' : ' items',
      ' left'
    ]),
    h('ul#filters.filters', [
      link('#/', 'All', route === 'all'),
      link('#/active', 'Active', route === 'active'),
      link('#/completed', 'Completed', route === 'completed')
    ]),
    h('button.clear-completed#clear-completed', {
      hidden: todosCompleted === 0,
      'ev-click': mercury.event(events.clearCompleted)
    }, 'Clear completed (' + String(todosCompleted) + ')')
  ])
}

function link(uri, text, isSelected) {
  return h('li', [
    h('a', { className: isSelected ? 'selected' : '', href: uri }, text)
  ])
}

function infoFooter() {
  return h('footer#info.info', [
    h('p', 'Double-click to edit a todo'),
    h('p', [
      'Written by ',
      h('a', { href: 'https://github.com/Raynos' }, 'Raynos')
    ]),
    h('p', [
      'Part of ',
      h('a', { href: 'http://todomvc.com' }, 'TodoMVC')
    ])
  ])
}
*/