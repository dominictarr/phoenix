var ssbapi = require('secure-scuttlebutt/api')
var Serializer = require('pull-serializer')
var JSONH = require('json-human-buffer')
var muxrpc = require('muxrpc')

function serialize (stream) {
  return Serializer(stream, JSONH, {split: '\n\n'})
}

var manifest = {
  async: [
    // core ssb
    'add',
    'get',
    'getPublicKey',
    'getLatest',
    'whoami'
  ],

  source: [
    // core ssb
    'createFeedStream',
    'createHistoryStream',
    'createLogStream',
    'messagesByType',
    'messagesLinkedToMessage',
    'messagesLinkedToFeed',
    'messagesLinkedFromFeed',
    'feedsLinkedToFeed',
    'feedsLinkedFromFeed',

    // phoenix
    'sync'
  ],

  duplex: [
    // phoenix
    'createReplicationStream'
  ]
}

function create(ssb, feed) {
  // create core ssb api
  var api = ssbapi(ssb, feed)

  // add phoenix methods
  api.sync = require('./sync')(ssb, feed)
  api.createReplicationStream = require('./createReplicationStream')(ssb, feed)

  return api
}

exports.client = function () {
  return muxrpc(manifest, null, serialize) ()
}

exports.server = function (ssb, feed) {
  return muxrpc(null, manifest, serialize) (create(ssb, feed))
}

exports.manifest = manifest

