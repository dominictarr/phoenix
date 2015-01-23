'use strict'
var h = require('hyperscript')
var pull = require('pull-stream')
var qs = require('querystring')
var com = require('../com')
var util = require('../lib/util')
var markdown = require('../lib/markdown')

var imageTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml'  
}
var markdownTypes = {
  md: 'text/x-markdown',
  txt: 'text/plain'
}
var objectTypes = {
  pdf: 'application/pdf'
}
var htmlTypes = {
  html: 'text/html',
  htm: 'text/html'
}

module.exports = function (app) {
  app.ssb.blobs.has(app.page.param, function (err, has) {
    var content
    if (has) {
      var uri = (app.page.qs.msg && app.page.qs.name) ?
        '/msg/'+app.page.qs.msg+'/ext/'+app.page.qs.name :
        '/ext/'+app.page.param
      content = h('.ext',
        h('div', 
          h('small.text-muted', app.page.qs.name), ' ',
          com.a(uri, 'open', { target: '_blank' })
        ),
        render(app)
      )
    } else {
      content = h('div', { style: 'display: inline-block' },
        com.panel('', [
          h('strong', 'File not (yet) found.'), h('br'),
          h('span', 'Scuttlebutt is searching the network. Stay on this page or check back later.')
        ])
      )
    }

    app.setPage('ext', h('.row',
      h('.col-xs-2.col-md-1', com.sidenav(app)),
      h('.col-xs-10.col-md-9', content),
      h('.hidden-xs.hidden-sm.col-md-2',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
  })
}

function getExt (name) {
  return name.split('.').slice(-1)
}

function fetch(app, cb) {
  var blob = ''
  function concat (chunk) {
    blob += atob(chunk)
  }
  pull(app.ssb.blobs.get(app.page.param), pull.drain(concat, function (err) {
    cb(err, blob)
  }))
}

function render (app) {
  var ext = getExt(app.page.qs.name)
  if (ext in imageTypes)
    return imageExt(app)
  if (ext in markdownTypes)
    return markdownExt(app)
  if (ext in objectTypes)
    return objectExt(app)
  if (ext in htmlTypes)
    return htmlExt(app)
  return undefined
}

function imageExt (app) {
  var name = app.page.qs.name
  return h('img.ext-img', { alt: name, title: name, src: '/ext/'+app.page.param })
}

function objectExt (app) {
  var name = app.page.qs.name
  var type = objectTypes[getExt(name)]
  return h('object.ext-obj', { data: '/ext/'+app.page.param, type: type })
}

function markdownExt (app) {
  var as = app.page.qs.as = app.page.qs.as || getExt(app.page.qs.name)
  var el = (as == 'md') ? h('.ext-markdown') : h('.ext-txt')
  fetch(app, function (err, blob) {
    if (as == 'md')
      el.innerHTML = markdown.block(blob, app.names)
    else
      el.textContent = blob
  })
  return h('div',
    options(app, { md: 'markdown', txt: 'text' }, 'as'),
    h('hr'), el
  )
}

function htmlExt (app) {
  var uri = (app.page.qs.msg && app.page.qs.name) ?
    '/msg/'+app.page.qs.msg+'/ext/'+app.page.qs.name :
    '/ext/'+app.page.param
  return h('iframe.ext-html', { src: uri, sandbox: 'allow-scripts allow-same-origin allow-popups' })
}

function options (app, opts, k) {
  var els = []
  for (var o in opts) {
    var q = JSON.parse(JSON.stringify(app.page.qs))
    q[k] = o

    var el = com.a('#/ext/'+app.page.param+'?'+qs.encode(q), opts[o])
    if (app.page.qs[k] == o)
      el = h('strong', el)
    els.push(h('li', el))
  }
  return h('ul.list-inline', els)
}