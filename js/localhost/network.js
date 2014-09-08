var fs = require('fs')
var path = require('path')
var http = require('http')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var prpc = require('phoenix-rpc')
var util = require('../common/util')
var sync = require('../common/sync')

var lastSync = 0

// Network Page

function renderNetworkPage(req, res, backend, ctx) {
  ctx.cuser_id = backend.local.user.name.toString('hex')
  util.read('html/network.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    
    backend.getNodes(function(err, nodes) {
      if (err) return console.error(err), res.writeHead(500), res.end();

      ctx.nodes = nodes
        .map(function(node) { return '<tr><td>' +
            '<h3><a href="http://'+node[0]+':'+node[1]+'">' + node[0] + '</a></h3>' +
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
  renderNetworkPage(req, res, backend, { error: '' })
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
      renderNetworkPage(req, res, backend, { error: (err) ? err.toString() : '' })
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

// Node Page
/*
function renderNodePage(req, res, backend, ctx) {
  ctx.cuser_id = backend.local.user.name.toString('hex')
  util.read('html/network-node.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    var hostParts = ctx.host.split(':')

    // Open a TCP channel
    console.log('Connecting to', ctx.host)
    var req2 = http.request({ method: 'CONNECT', hostname: hostParts[0], port: hostParts[1] || 64000, path: '/' })
    req2.on('connect', function(res2, conn, head) {
      console.log(ctx.host + ' connected, fetching profiles.')

      // Create rpc stream
      var nodeBackend = prpc.client()
      nodeBackend.pipe(conn).pipe(nodeBackend)

      // Pull profiles
      var fetchProfile = util.profileFetcher(nodeBackend.api)
      pull(
        toPull(nodeBackend.api.following()),
        // pull.asyncMap(fetchProfile),
        pull.collect(function (err, entries) {
          if (err) { return console.error(err), res.writeHead(500), res.end() }
          ctx.users = entries.map(function(entry) {
            return '<a href="/network/'+ctx.host+'/profile/'+entry.key.toString('hex')+'">'+entry.nickname+'</a><br>'
          }).join('')
          
          res.writeHead(200, {'Content-Type': 'text/html'})
          res.end(util.renderCtx(html.toString(), ctx))
        })
      )
    })
    req2.on('error', function(e) {
      console.log(ctx.host + ' failed, ' + e.message)
      res.writeHead(500), res.end()
    })
    req2.end()
  }))
}

exports.getNode = function(req, res, backend) {
  var host = req.url.slice('/network/'.length)
  renderNodePage(req, res, backend, { host: host })
}
*/
exports.deleteNode = function(req, res, backend) {
  var addr = req.url.slice('/network/del/'.length)
  addr = addr.split(':')
  backend.delNode(addr[0], +addr[1] || 64000, serve)
  function serve(err) {
    res.writeHead(303, {'Location': '/network'})
    res.end()
  }
}