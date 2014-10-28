var MRPC = require('muxrpc')
var pull = require('pull-stream')
var pushable = require('pull-pushable')
var manifest = require('./gui-sandbox-rpc-manifest')

exports.createIframe = function(html, mid, replies, onReply) {
  // create iframe
  var iframe = document.createElement('iframe')
  iframe.setAttribute('src', '/gui-sandbox')
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.setAttribute('seamless', 'seamless')

  // create rpc api
  iframe.replies = replies || []
  var rpc = MRPC(manifest.iframe, manifest.container)({
    ready: function() {
      rpc.inject(html, function(){})
    },
    addReply: function(postType, text, cb) {
      if (postType != 'text' && postType != 'action' && postType != 'gui')
        return cb(new Error('postType must be text, action, or gui'))
      if (!text)
        return cb(new Error('Can not post an empty string'))

      if (onReply) {
        // use provided handler
        onReply({ postType: postType, text: text, mid: mid, cb: cb })
      } else {
        // emulate it
        alert('Your GUI posted a '+postType+' post with the content: '+text)
        iframe.replies.push({ content: { type: 'post', postType: postType, text: text }, timestamp: Date.now() })
        cb()
      }
    },
    getReplies: function(cb) {
      cb(null, iframe.replies)
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
