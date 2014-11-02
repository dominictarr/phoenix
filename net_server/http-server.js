var fs         = require('fs')
var path       = require('path')
var multicb    = require('multicb')
var less       = require('less')
var browserify = require('browserify')

module.exports = function(opts) {
  return function (req, res) {
    function pathStarts(v) { return req.url.indexOf(v) === 0; }
    function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
    function type (t) { res.setHeader('Content-Type', t) }
    function resolve(file) { return path.join(__dirname, '../web_frontend/' + file) }
    function read(file) { return fs.createReadStream(resolve(file)); }
    function serve(file) { return read(file).on('error', serve404).pipe(res) }
    function serve404() {  res.writeHead(404); res.end('Not found'); }

    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + opts.homeport)
    
    // Homepage
    if (req.url == '/' || req.url == '/index.html') {
      type('text/html')
      return serve('html/home.html')
    }
    if (pathStarts('/gui-sandbox')) {
      var loaded = multicb()
      fs.readFile(resolve('html/gui-sandbox.html'), { encoding: 'utf-8' }, loaded())
      fs.readFile(resolve('js/gui-sandbox.js'), { encoding: 'utf-8' }, loaded())
      fs.readFile(resolve('css/gui-sandbox.css'), { encoding: 'utf-8' }, loaded())
      loaded(function(err, results) {
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
      return
    }

    // CSS
    if (pathStarts('/css/')) {
      var name = path.basename(req.url, '.css')
      var filepath = resolve('less/'+name+'.less')
      fs.readFile(filepath, { encoding: 'utf-8' }, function(err, lessStr) {
        if (err) return serve404()
        less.render(lessStr, { paths: [resolve('less')], filename: name + '.less' }, function(err, cssStr) {
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
      })
      return
    }

    // JS
    if (pathStarts('/js/')) {
      var b = browserify({ basedir: resolve('src') })
      b.add(resolve('src/'+path.basename(req.url)))
      b.ignore('proquint-')
      b.ignore('http')
      b.ignore('level')
      b.ignore('level/sublevel')
      b.ignore('level-sublevel/bytewise')
      b.ignore('pull-level')
      type('application/javascript')
      b.bundle()
        .on('error', function(err) {
          console.error(err.toString())
          serve404()
        })
        .pipe(res)
      return
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