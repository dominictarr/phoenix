var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var concat = require('concat-stream')
var util = require('./util')

function renderPage(req, res, backend, ctx) {
  util.read('html/network.html').on('error', util.serve404(res)).pipe(concat(function(html) {
    
    backend.getNodes(function(err, nodes) {
      if (err) return console.error(err), res.writeHead(500), res.end();

      ctx.nodes = nodes
        .map(function(node) { return '<tr><td>' +
            '<h3><a href="http://'+node[0]+'" target="_blank">' + node[0] + '</a></h3>' +
            '<p><span class="small btn default"><a href="#">Remove</a></span></p>' +
          '</td></tr>'
        })
        .join('')
      
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(util.renderCtx(html.toString(), ctx))
    })
  }))
}

exports.get = function(req, res, backend) {
  renderPage(req, res, backend, { error: '' })
}