var pull     = require('pull-stream')
var toPull   = require('stream-to-pull-stream')
var http     = require('http')

var level    = require('level')
var sublevel = require('level-sublevel/bytewise')
var ssb      = require('secure-scuttlebutt')
var ssbapi   = require('secure-scuttlebutt/api')

var cfg      = require('./config');
var keys     = require('./keys')

module.exports = connect
var backend = {
  ssb: null,
  feed: null
}

function connect(cb) {
  // connect to the home server
  var req = http.request({ method: 'CONNECT', hostname: 'localhost', port: cfg.homeport, path: '/' })
  req.on('connect', function(res, conn, head) {
    // connection successful, create rpc client
    var client = ssbapi.client()
    var clientStream = client.createStream()
    pull(clientStream, toPull.duplex(conn), clientStream)
    cb(null, client)
  });
  req.on('error', function(err) {
    if (err.code != 'ECONNREFUSED') return cb(err)

    // connection failed, create an in-process server
    if (!backend.ssb) {
      // load keys, db, ssb, feed
      console.log('Keyfile:', cfg.namefile)
      var keypair = keys.load(cfg.namefile)
      if (!keypair) {
        console.log('')
        console.log('  No profile found.')
        console.log('  Please run "node phoenix setup" first.')
        console.log('')
        process.exit(0)
      }
      console.log('Database:', cfg.dbpath)
      backend.ssb = require('secure-scuttlebutt/create')(cfg.dbpath)
      backend.feed = backend.ssb.createFeed(keypair)
    }

    // create an rpc server
    var server = ssbapi.server(backend.ssb, backend.feed)
    serverStream = server.createStream()

    // create am rpc client to our server
    var client = ssbapi.client()
    var clientStream = client.createStream()
    pull(clientStream, serverStream, clientStream)
    cb(null, client, backend)
  })
  req.setTimeout(3000, function() { req.abort() })
  req.end()
}