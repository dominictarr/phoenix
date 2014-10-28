var MRPC = require('muxrpc')
var pull = require('pull-stream')
var pushable = require('pull-pushable')
var manifest = require('./gui-sandbox-rpc-manifest')

exports.createIframe = function(html) {
  // create iframe
  var iframe = document.createElement('iframe')
  iframe.setAttribute('src', '/gui-sandbox')
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.setAttribute('seamless', 'seamless')

  // create rpc api
  var rpc = MRPC(manifest.iframe, manifest.container)({
    ready: function() {
      rpc.inject(html, function(){})
    },
    post: function(msg, cb) {
      alert(JSON.stringify(msg))
      cb()
    },
    replies: function() {
      alert ('replies TODO')
      return null
    }
  })

  // wire up the rpc stream
  // :TODO: this needs to cleanup when the iframe is destroyed
  if (rpc) {
    var rpcStream = rpc.createStream()

    // in
    var rpcPush = pushable()
    pull(rpcPush, rpcStream.sink)
    window.addEventListener('message', function(e) {
      if (e.source == iframe.contentWindow)
        rpcPush.push(e.data)
    }, false);

    // out
    pull(rpcStream.source, pull.drain(function(chunk) {
      iframe.contentWindow.postMessage(chunk, '*')
    }))
  }

  return iframe
}
