var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var util = require('./util')
var sync = require('../common/sync')

var lastSync = 0

function renderPage(req, res, backend, ctx) {
  ctx.cuser_id = backend.local.user.name.toString('hex')
  util.read('html/network.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    
    backend.getNodes(function(err, nodes) {
      if (err) return console.error(err), res.writeHead(500), res.end();

      ctx.nodes = nodes
        .map(function(node) { return '<tr><td>' +
            '<h3><a href="http://'+node[0]+'" target="_blank">' + node[0] + '</a></h3>' +
            '<form class="del-form" action="/network/del/'+node[0]+':'+node[1]+'" method="POST"><span class="small btn default"><button>Remove</button></span></form>' +
          '</td></tr>'
        })
        .join('')

      ctx.last_sync = (lastSync) ? util.prettydate(lastSync, true) : '--'
      
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(util.renderCtx(html.toString(), ctx))
    })
  }))
}

exports.get = function(req, res, backend) {
  renderPage(req, res, backend, { error: '' })
}

exports.post = function(req, res, backend) {
  req.pipe(concat(function(form) {

    var form = require('querystring').parse(form.toString())
    if (form && form.address) {
      var addr = form.address.split(':');
      backend.addNode(addr[0], +addr[1] || 64000, serve)
    } else {
      serve(new Error('Cant post an empty message'))
    }

    function serve(err) {
      renderPage(req, res, backend, { error: (err) ? err.toString() : '' })
    }
  }))
}

exports.sync = function(req, res, backend) {
  req.pipe(concat(function(form) {

    var location = '/network'
    var form = require('querystring').parse(form.toString())
    if (form && form.redirect && (form.redirect == '/' || /^\/[^\/]/.test(form.redirect))) // must be a relative url
      location = form.redirect

    sync(backend, function() {
      lastSync = new Date()
      res.writeHead(303, {'Location': location})
      res.end()
    })
  }))
}

exports.deleteNode = function(req, res, backend) {
  var addr = req.url.slice('/network/del/'.length)
  addr = addr.split(':')
  backend.delNode(addr[0], +addr[1] || 64000, serve)
  function serve(err) {
    res.writeHead(303, {'Location': '/network'})
    res.end()
  }
}