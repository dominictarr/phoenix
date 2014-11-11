var ssbapi = require('secure-scuttlebutt/api')
var Serializer = require('pull-serializer')
var JSONH = require('json-human-buffer')
var muxrpc = require('muxrpc')

function serialize (stream) {
  return Serializer(stream, JSONH, {split: '\n\n'})
}

var manifests = {
  owner: {
    async: [
      // core ssb
      'add',
      'get',
      'getPublicKey',
      'getLatest',
      'whoami',

      // phoenix
      'getUserPages'
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
  },
  anon: {
    async: [
      // core ssb
      'getPublicKey',
      'whoami'
    ],

    source: [
    ],

    duplex: [
      // phoenix
      'createReplicationStream'
    ]
  }
}

function create(ssb, feed, permLevel) {
  // create core ssb api
  var api = ssbapi(ssb, feed)

  // add phoenix methods
  api.sync = require('./sync')(ssb, feed)
  api.createReplicationStream = require('./createReplicationStream')(ssb, feed)
  api.getUserPages = require('./getUserPages')(ssb, feed)

  return api
}

exports.client = function () {
  // always assume owner-perms from the client
  return muxrpc(manifests.owner, null, serialize) ()
}

exports.server = function (ssb, feed, permLevel) {
  return muxrpc(null, manifests[permLevel], serialize) (create(ssb, feed, permLevel))
}

exports.manifests = manifests

