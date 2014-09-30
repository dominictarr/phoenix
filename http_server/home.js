var http    = require('http');
var fs      = require('fs');
var path    = require('path');
var concat  = require('concat-stream')
var shoe    = require('shoe');
var prpc    = require('phoenix-rpc')
var connect = require('../lib/backend')

// var feed = require('./feed')
// var profile = require('./profile')
// var network = require('./network')

function createServer(port, opts) {
  connect(function (err, backend) {
    if (err) return console.error(err);

    // Pull state from the backend
    backend.local = { userid: null, userpubkey: null, lastSync: null, lastSyncResults: null }
    backend.getKeys(function(err, keys) {
      if (err) throw err
      if (!keys.exist) {
        console.log('')
        console.log('  No profile found.')
        console.log('  Please run "node phoenix setup" first.')
        console.log('')
        process.exit(0)
      }
      backend.local.userid = keys.name
      backend.local.userpubkey = keys.public
    })
    backend.getSyncState(function(err, state) {
      if (state && state.lastSync)
        backend.local.lastSync = new Date(state.lastSync)
    })

    // Setup periodic syncs
    require('../lib/background-sync')(backend, 1000 * 60 * 15)

    // Create HTTP server
    var server = http.createServer(function (req, res) {
      function pathStarts(v) { return req.url.indexOf(v) === 0; }
      function pathEnds(v) { return req.url.indexOf(v) === (req.url.length - v.length); }
      function type (t) { res.writeHead(200, {'Content-Type': t}) }
      function read(file) { return fs.createReadStream(path.join(__dirname, '../web_frontend/' + file)); }
      function serve(file) { return read(file).on('error', serve404).pipe(res) }
      function serve404() {  res.writeHead(404); res.end('Not found'); }
      
      // Static asset routes
      if (req.url == '/' || req.url == '/index.html') {
        type('text/html')
        return serve('html/home.html')
      }
      if (pathEnds('jpg'))        type('image/jpeg')
      else if (pathEnds('jpeg'))  type('image/jpeg')
      else if (pathEnds('gif'))   type('image/gif')
      else if (pathEnds('ico'))   type('image/x-icon');
      else if (pathEnds('png'))   type('image/png');
      else if (pathEnds('js'))    type('application/javascript')
      else if (pathEnds('css'))   type('text/css')
      else if (pathEnds('woff'))  type('application/x-font-woff')
      else if (pathEnds('woff2')) type('application/font-woff2')
      if (pathStarts('/js/') || pathStarts('/css/') || pathStarts('/img/') || pathStarts('/fonts/'))
        return serve(req.url)
      serve404();
    });
    server.listen(port, '127.0.0.1');

    // Install the websocket host
    if (opts.ws) {
      var sock = shoe(function (conn) {
        var through = require('through')
        // :TODO: proper perms
        // :TODO: remove base64 conversions with a binary websocket
        var allowedMethods = Object.keys(backend).filter(function(name) { return typeof backend[name] == 'function' })
        conn
          .pipe(through(function(chunk) { this.queue(new Buffer(chunk, 'base64')) }))
          .pipe(prpc.proxy(backend, allowedMethods))
          .pipe(through(function(chunk) { this.queue(chunk.toString('base64')) }))
          .pipe(conn)
        conn.on('log', console.log.bind(console, 'WS'))
      });
      sock.install(server, '/ws');
      sock.on('log', console.log.bind(console, 'WS'))
    }
  })
}

module.exports = {
  createServer: createServer
};