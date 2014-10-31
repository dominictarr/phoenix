var cfg      = require('./config')
var keys     = require('ssb-keys')

exports.setup = function() {
  // load keys, db, ssb, feed
  console.log('Keyfile:', cfg.namefile)
  var keypair = keys.loadSync(cfg.namefile)
  if (!keypair) {
    console.log('')
    console.log('  No profile found.')
    console.log('  Please run "phoenix setup" first.')
    console.log('')
    process.exit(0)
  }
  console.log('Database:', cfg.dbpath)
  exports.ssb = require('secure-scuttlebutt/create')(cfg.dbpath)
  exports.feed = exports.ssb.createFeed(keypair)
}