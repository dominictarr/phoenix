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

module.exports = function (app) {
  var blob = ''
  function concat (chunk) {
    blob += atob(chunk)
  }
  pull(app.ssb.blobs.get(app.page.param), pull.drain(concat, function (err) {
    var content
    if (!err) {
      content = h('.ext',
        h('div', h('small.text-muted', app.page.qs.name)),
        render(app, blob)
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
  }))
}

function getExt (name) {
  return name.split('.').slice(-1)
}

function render (app, blob) {
  var ext = getExt(app.page.qs.name)
  if (ext in imageTypes)
    return imageExt(app, blob)
  if (ext in markdownTypes)
    return markdownExt(app, blob)
  if (ext in objectTypes)
    return objectExt(app, blob)    
  return h('div', blob)
}

function imageExt (app, blob) {
  var name = app.page.qs.name
  return h('img.ext-img', { alt: name, title: name, src: 'data:'+imageTypes[getExt(name)]+';base64,'+btoa(blob) })
}

function objectExt (app, blob) {
  var name = app.page.qs.name
  var type = objectTypes[getExt(name)]
  return h('object.ext-obj', { data: 'data:'+type+';charset=utf-8;base64,'+btoa(blob), type: type })
}

function markdownExt (app, blob) {
  app.page.qs.as = app.page.qs.as || getExt(app.page.qs.name)
  return h('div',
    options(app, { md: 'markdown', txt: 'raw' }, 'as'),
    h('hr'),
    (app.page.qs.as == 'md') ?
      h('.ext-markdown', { innerHTML: markdown.block(blob, app.names) }) :
      h('.ext-txt', blob)
  )
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