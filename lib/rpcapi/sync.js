var pull = require('pull-stream')
var pushable = require('pull-pushable')
var apiClient = require('../../net_server/api-client')

module.exports = function(ssb, feed) {
  return function (host, port) {
    var ps = pushable()

    // replicate with target
    console.log('connecting to',host,port)
    var remote = apiClient(port, host)
    var rstream = feed.createReplicationStream({ rel: 'follows', progress: function() { ps.push(arguments) } }, done)
    pull(
      rstream,
      remote.createReplicationStream(),
      rstream
    )
    remote.socket.on('error', function (err) {
      console.log('fail',err)
      ps.push(err)
      ps.end()
    })
    function done (err, sent, recv, expected) {
      console.log('done', arguments)
      if (err) ps.push(err)
      else ps.push([sent, recv, expected])
      ps.end()
      remote.socket.end()
    }

    return ps
  }
}
