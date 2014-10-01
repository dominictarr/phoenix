var mercury = require('mercury')
var h = require('mercury').h

module.exports = render

// Main Components
// ===============

function render(state) {
  return h('.homeapp.container', { 'style': { 'visibility': 'hidden' } }, [
    stylesheet('/css/home.css'),
    mercury.partial(header, state.currentUserId),
    h('.feedpage.row', [
      h('.col-xs-8', [feed(state.feed), mercury.partial(mascot, 'Dont let life get you down!')]),
      h('.col-xs-4', [mercury.partial(feedControls), mercury.partial(profileLinks, state.profiles)])
    ])
  ])
}

function header(currentUserId) {
  var sep = function() { return h('small', ' / ') }
  return h('.nav-header', [
    h('strong', 'phoenix'),
    sep(), a('/', 'latest'),
    sep(), a('/profile/' + currentUserId, 'profile'),
    sep(), a('/network', 'network'),
    a('/profile/' + currentUserId + '/intro-token', 'your intro token', { className: 'pull-right' })
  ])
}

function feed(feed) {
  return h('div', 'feed todo')
}

function feedControls() {
  return h('div', 'feed controls todo')  
}

function profileLinks(profiles) {
  return h('div', 'profile links todo')  
}

function mascot(quote) {
  return h('.class', [
    img('/img/logo.png'),
    h('strong', [h('small', quote)])
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