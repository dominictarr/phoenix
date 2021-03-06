var fs         = require('fs')
var path       = require('path')
var multicb    = require('multicb')
var less       = require('less')
var browserify = require('browserify')
var request    = require('request');

// stupid-simple etag solution: cache everything!
var eTag       = (Math.random() * 100000)|0

module.exports = function(opts) {
  return function (req, res) {
    function pathStarts(v) { return req.url.indexOf(v) === 0; }
    function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
    function type (t) { res.setHeader('Content-Type', t) }
    function resolve(file) { return path.join(__dirname, '../web_frontend/' + file) }
    function read(file) { return fs.createReadStream(resolve(file)); }
    function serve(file) { return read(file).on('error', serve404).pipe(res) }
    function serve404() {  res.writeHead(404); res.end('Not found'); }
    function renderCss(name, cb) {
      var filepath = resolve('less/'+name)
      fs.readFile(filepath, { encoding: 'utf-8' }, function(err, lessStr) {
        if (err) return cb(err)
        less.render(lessStr, { paths: [resolve('less')], filename: name + '.less' }, cb)
      })
    }
    function renderJs(name, cb) {
      var b = browserify({ basedir: resolve('src') })
      b.add(resolve('src/'+name))
      // :TODO: remove these ignores? these are from the old phoenix-rpc days
      b.ignore('proquint-')
      b.ignore('http')
      b.ignore('level')
      b.ignore('level/sublevel')
      b.ignore('level-sublevel/bytewise')
      b.ignore('pull-level')
      b.bundle(cb)
    }

    // Caching
    if (req.headers['if-none-match'] == eTag) {
      res.writeHead(304)
      return res.end()
    }
    res.setHeader('ETag', eTag)

    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + opts.port)
    
    // Homepage
    if (req.url == '/' || req.url == '/index.html') {
      type('text/html')
      return serve('html/home.html')
    }

    // Gui sandbox
    if (pathStarts('/gui-sandbox')) {
      var loaded = multicb()
      fs.readFile(resolve('html/gui-sandbox.html'), { encoding: 'utf-8' }, loaded())
      renderJs('gui-sandbox.js', loaded())
      renderCss('gui-sandbox.less', loaded())
      return loaded(function(err, results) {
        if (err) return console.error(err), serve404()
        var html = results[0][1]
        var script = results[1][1]
        var style = results[2][1]
        html = html.replace('$SCRIPT', script)
        html = html.replace('$STYLE', style)

        res.setHeader('Content-Security-Policy', 'default-src \'self\' \'unsafe-inline\'')
        type('text/html')
        res.writeHead(200)
        res.end(html)
      })
    }

    // User page sandbox
    if (pathStarts('/user/') && pathEnds('.js')) {
      var loaded = multicb()
      var dir = path.join(__dirname, '..', path.dirname(req.url))
      renderCss('gui-sandbox.less', loaded())
      browserify({ basedir: dir })
        .add(path.join(__dirname, '../web_frontend/src/user-page.js')) // :TODO: publish user-page.js as an npm module and remove this add() call
        .add(path.join(dir, path.basename(req.url)))
        .bundle(loaded())
      return loaded(function (err, results) {
        if (err) return console.error(err), serve404()

        var css = results[0][1]
        var js  = results[1][1]

        res.setHeader('Content-Security-Policy', 'default-src \'self\' \'unsafe-inline\' \'unsafe-eval\'')
        type('text/html')
        res.writeHead(200)
        res.end('<html><head><style>'+css+'</style></head><body></body><script>'+js+'</script></html>')
      })
    }

    // CSS
    if (pathStarts('/css/') && pathEnds('.css')) {
      return renderCss(path.basename(req.url, '.css')+'.less', function(err, cssStr) {
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
          console.error(err)
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
    serve404();
  }
}