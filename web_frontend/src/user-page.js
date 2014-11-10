var manifest = require('./lib/user-page-rpc-manifest')
var MRPC = require('muxrpc')
var pull = require('pull-stream')
var pushable = require('pull-pushable')

// wire up the rpc stream
var rpc = MRPC(manifest.container, manifest.iframe)({})
var rpcStream = rpc.createStream()

// in
var rpcPush = pushable()
pull(rpcPush, rpcStream.sink)
window.addEventListener('message', function(e) {  
  rpcPush.push(e.data)  
}, false);

// out
pull(rpcStream.source, pull.drain(function(chunk) {
  parent.postMessage(chunk, '*')
}))


// :DEBUG: temporary, until this file is published on npm
window.phoenix = rpc