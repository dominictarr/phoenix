var MRPC     = require('muxrpc')
var pull     = require('pull-stream')
var pushable = require('pull-pushable')

var manifest = require('./user-page-rpc-manifest')
var bus      = require('./business')
var ws       = require('./ws-rpc')

var Serializer = require('pull-serializer')
var JSONH = require('json-human-buffer')

function serialize (stream) {
  return Serializer(stream, JSONH, {split: '\n\n'})
}

var curRPC
var curFrameID
exports.addListeners = function(state) {
  window.addEventListener('message', function(e) {
    // find the origin iframe
    var iframe
    var iframes = document.querySelectorAll('iframe')
    for (var i = 0; i < iframes.length; i++) {
      iframe = iframes[i]
      if (e.source == iframe.contentWindow)
        break
    }
    if (!iframe)
      return
    
    // handle RPC
    if (iframe.id != curFrameID) {
      setupIframeRPC(state, iframe)
      curFrameID = iframe.id
    }
    curRPC.recv(e.data)
  }, false)
}

function setupIframeRPC(state, iframe) {
  // create rpc
  curRPC = MRPC(manifest.iframe, manifest.container, serialize)(createApi(state, iframe))
  var rpcStream = curRPC.createStream()

  // in
  var rpcPush = pushable()
  pull(rpcPush, rpcStream.sink)
  curRPC.recv = rpcPush.push.bind(rpcPush)

  // out
  pull(rpcStream.source, pull.drain(function(chunk) {
    iframe.contentWindow.postMessage(chunk, '*')
  }))
}

function createApi(state, iframe) {
  return {
    add: function(msg, cb) {
      if (!confirm('This page would like to post to your feed. Allow it?'))
        return cb(new Error('Access denied'))
      ws.api.add(msg, function(err) {
        if (!err)
          bus.syncView(state)
        cb(err)
      })
    },
    get: function(key, cb) {
      ws.api.get(key, cb)
    },
    getPublicKey: function(id, cb) {
      ws.api.getPublicKey(id, cb)
    },
    whoami: function(cb) {
      ws.api.whoami(cb)
    },
    setIframeHeight: function(h, cb) {
      iframe.style.height = h
      cb()
    },
    createFeedStream: function(opts) {
      return ws.api.createFeedStream(opts)
    },
    createHistoryStream: function(id, seq, live) {
      return ws.api.createHistoryStream(id, seq, live)
    },
    createLogStream: function(opts) {
      return ws.api.createLogStream(opts)
    },
    messagesByType: function(opts) {
      return ws.api.messagesByType(opts)
    },
    messagesLinkedToMessage: function(id, rel) {
      return ws.api.messagesLinkedToMessage(id, rel)
    },
    messagesLinkedToFeed: function(id, rel) {
      return ws.api.messagesLinkedToFeed(id, rel)
    },
    messagesLinkedFromFeed: function(id, rel) {
      return ws.api.messagesLinkedFromFeed(id, rel)
    },
    feedsLinkedToFeed: function(id, rel) {
      return ws.api.feedsLinkedToFeed(id, rel)
    },
    feedsLinkedFromFeed: function(id, rel) {
      return ws.api.feedsLinkedFromFeed(id, rel)
    }
  }
}
