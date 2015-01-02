var fs   = require('fs')
var path = require('path')
var once = require('once')

module.exports = function(server) {
  function resolve(file) { return path.join(__dirname, file) }

  // check for the built assets
  try { 
    fs.statSync(resolve('js'))
    fs.statSync(resolve('css'))
  } catch (e) { server.config.dev = true }
  if (server.config.dev)
    console.log('Dev-mode: building JS and CSS in-memory on each request')

  return function(req, res, next) {
    if (!server.config.dev)
      return next()

    function pathStarts(v) { return req.url.indexOf(v) === 0; }
    function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
    function type (t) { res.setHeader('Content-Type', t) }

    // CSS
    if (pathStarts('/css/') && pathEnds('.css')) {
      var less = require('less')
      var name = path.basename(req.url, '.css')+'.less'
      var filepath = resolve('less/'+name)
      return fs.readFile(filepath, { encoding: 'utf-8' }, function(err, lessStr) {
        if (err) return next() // not found, try pre-built static
        less.render(lessStr, { paths: [resolve('less')], filename: name }, serveCss)
      })
      function serveCss(err, cssStr) {
        if (err) {
          res.writeHead(500)
          res.end(err.toString())
          console.error(err)
        } else {
          type('text/css')
          res.writeHead(200)
          res.end(cssStr)
        }
      }
    }

    // JS
    if (pathStarts('/js/') && pathEnds('.js')) {
      var browserify = require('browserify')
      var b = browserify({ basedir: resolve('src') })
      b.add(resolve('src/'+path.basename(req.url)))
      return b.bundle(once(function (err, jsStr) {
        if (err) {
          if (err.toString().indexOf('Cannot find module') !== -1)
            return next() // not found, try pre-built static
          res.writeHead(500)
          res.end(err.toString())
          console.error(err.toString())
        } else {
          type('application/javascript')
          res.writeHead(200)
          res.end(jsStr)
        }
      }))
    }

    next()
  }
}