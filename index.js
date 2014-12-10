var once       = require('once')
var fs         = require('fs')
var path       = require('path')
var multicb    = require('multicb')
var request    = require('request')

exports.name = 'phoenix'
exports.version = '1.0.0'

exports.manifest = {
  useInvite: 'async'
}
exports.permissions = {
  anonymous: {deny: ['useInvite']}
}

exports.init = function (server) {
  server.on('request', onRequest(server))
  return {
    // connect to the peer and use the invite code
    useInvite: function(invite, cb) {
      if (!invite.address || !invite.secret)
        return cb(new Error('Invalid invite'))

      var addr = invite.address.split(':')
      if (addr.length === 2)
        addr = { host: addr[0], port: addr[1] }
      else
        addr = { host: addr[0], port: 2000 }

      // connect to and auth with the given server
      var rpc = server.connect(addr)

      // use the invite
      var hmacd = server.options.signObjHmac(invite.secret, {
        keyId: server.options.hash(invite.secret, 'base64'),
        feed: server.feed.id,
        ts: Date.now()
      })
      rpc.invite.use(hmacd, function (err, msg) {
        if (err) return cb(err)

        // publish pub message
        server.feed.add('pub', {address: addr}, function(err) {
          if (err) return cb(err)
          cb()
        })
      })
    }
  }
}

// stupid-simple etag solution: cache everything!
var eTag = (Math.random() * 100000)|0

// HTTP request handler
function onRequest(server) {
  function resolve(file) { return path.join(__dirname, file) }

  // check for the built assets
  var buildJs = false, buildCss = false
  try { fs.statSync(resolve('js')) }
  catch (e) { buildJs = true, console.log('Built JS assets do not exist, building in-memory on each request') }
  try { fs.statSync(resolve('css')) }
  catch (e) { buildCss = true, console.log('Built CSS assets do not exist, building in-memory on each request') }

  return function(req, res) {
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

    // Local-host only
    if (req.socket.remoteAddress != '127.0.0.1') {
      console.log('Remote access attempted by', req.socket.remoteAddress)
      res.writeHead(403)
      return res.end('Remote access forbidden')
    }

    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:' + server.config.port)

    // Access token
    // :NOTE: not cached
    if (req.url == '/access.json') {
      type('application/json')
      res.writeHead(200)
      var accessSecret = server.createAccessKey({allow: null}) // allow all
      var accessToken = server.options.signObjHmac(accessSecret, {
        role: 'client',
        ts: Date.now(),
        keyId: server.options.hash(accessSecret)
      })
      return res.end(JSON.stringify(accessToken))
    }

    // Caching
    if (req.headers['if-none-match'] == eTag) {
      res.writeHead(304)
      return res.end()
    }
    res.setHeader('ETag', eTag)

    // Homepage
    if (req.url == '/' || req.url == '/index.html') {
      type('text/html')
      return serve('html/home.html')
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
    serve404()
  }
}
