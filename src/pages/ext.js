'use strict'
var h = require('hyperscript')
var pull = require('pull-stream')
var com = require('../com')
var util = require('../lib/util')

module.exports = function (app) {
  var blob = ''
  function concat (chunk) {
    blob += atob(chunk)
  }
  pull(app.ssb.blobs.get(app.page.param), pull.drain(concat, function (err) {
    var content
    if (!err) {
      var name = app.page.qs.name
      content = h('.ext',
        h('p', h('small.text-muted', name)),
        (isImage(name)) ? imageEl(name, blob) : h('div', blob)
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
      h('.col-xs-8', content),
      h('.col-xs-2.col-md-3',
        com.adverts(app),
        h('hr'),
        com.sidehelp(app)
      )
    ))
  }))
}

var imageTypes = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml'  
}

function getExt (name) {
  return name.split('.').slice(-1)
}

function isImage (name) {
  return (getExt(name) in imageTypes)
}

function imageEl (name, blob) {
  return h('img', { src: 'data:'+imageTypes[getExt(name)]+';base64,'+btoa(blob) })
}