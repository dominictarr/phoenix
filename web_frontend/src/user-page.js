var manifest = require('./lib/user-page-rpc-manifest')
var MRPC = require('muxrpc')
var pull = require('pull-stream')
var pushable = require('pull-pushable')

var Serializer = require('pull-serializer')
var JSONH = require('json-human-buffer')

function serialize (stream) {
  return Serializer(stream, JSONH, {split: '\n\n'})
}


// wire up the rpc stream
var rpc = MRPC(manifest.container, manifest.iframe, serialize)({})
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
