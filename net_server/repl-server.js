var rpcapi   = require('../lib/rpcapi')
var pull     = require('pull-stream')
var toStream = require('pull-stream-to-stream')

var n = 0
module.exports = function(opts, backendClient, backend) {
  return function (stream) {
    var requestNumber = n++
    console.log('SERVER: received replication request #'+requestNumber+', starting stream...')
    var replStream = toStream(backend.feed.createReplicationStream({ rel: 'follows' }, function (err, sent, recv, expected) {
      console.log('SERVER: finished replication #'+requestNumber, sent, recv, expected)
    }))
    stream.pipe(replStream).pipe(stream)
  }
}