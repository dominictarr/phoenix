var fs   = require('fs')
var path = require('path')
var once = require('once')

module.exports = function(server) {
  function resolve(file) { return path.join(__dirname, file) }

  // check for the built assets
  var buildJs = false, buildCss = false
  try { fs.statSync(resolve('js')) }
  catch (e) { buildJs = true, console.log('Built JS assets do not exist, building in-memory on each request') }
  try { fs.statSync(resolve('css')) }
  catch (e) { buildCss = true, console.log('Built CSS assets do not exist, building in-memory on each request') }

  return function(req, res, next) {
    function pathStarts(v) { return req.url.indexOf(v) === 0; }
    function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
    function type (t) { res.setHeader('Content-Type', t) }
    function read(file) { return fs.createReadStream(resolve(file)); }
    function serve(file) { return read(file).on('error', serve404).pipe(res) }
    function serve404() { res.writeHead(404); res.end('Not found'); }
    function renderCss(name, cb) {
      if (buildCss) {
        var less = require('less')
        name = path.basename(name, '.css')+'.less'
        var filepath = resolve('less/'+name)
        fs.readFile(filepath, { encoding: 'utf-8' }, function(err, lessStr) {
          if (err) return cb(err)
          less.render(lessStr, { paths: [resolve('less')], filename: name }, cb)
        })
      } else
        fs.readFile(resolve('css/'+name), { encoding: 'utf-8' }, cb)
    }
    function renderJs(name, cb) {
      if (buildJs) {
        var browserify = require('browserify')
        var b = browserify({ basedir: resolve('src') })
        b.add(resolve('src/'+name))
        b.bundle(once(cb))
      } else
        fs.readFile(resolve('js/'+name), { encoding: 'utf-8' }, cb)
    }

    // Homepage
    if (req.url == '/' || req.url == '/index.html') {
      type('text/html')
      return serve('html/home.html')
    }

    // Auth page
    if (req.url.indexOf('/auth.html') === 0 && req.method == 'GET') {
      type('text/html')
      return serve('html/auth.html')
    }
    // CSS
    if (pathStarts('/css/') && pathEnds('.css')) {
      return renderCss(path.basename(req.url), function(err, cssStr) {
        if (err) {
          res.writeHead(500)
          res.end(err.toString())
          console.error(err)
        } else {
          type('text/css')
          res.writeHead(200)
          res.end(cssStr)
        }
      })
    }

    // JS
    if (pathStarts('/js/') && pathEnds('.js')) {
      return renderJs(path.basename(req.url), function(err, jsStr) {
        if (err) {
          res.writeHead(500)
          res.end(err.toString())
          console.error(err.toString())
        } else {
          type('application/javascript')
          res.writeHead(200)
          res.end(jsStr)
        }
      })
    }

    // Static asset routes
    if (pathEnds('jpg'))        type('image/jpeg')
    else if (pathEnds('jpeg'))  type('image/jpeg')
    else if (pathEnds('gif'))   type('image/gif')
    else if (pathEnds('ico'))   type('image/x-icon');
    else if (pathEnds('png'))   type('image/png');
    else if (pathEnds('woff'))  type('application/x-font-woff')
    else if (pathEnds('woff2')) type('application/font-woff2')
    if (pathStarts('/img/') || pathStarts('/fonts/'))
      return serve(req.url)
    next()
  }
}