var pull = require('pull-stream')
var toStream = require('pull-stream-to-stream')
var pushable = require('pull-pushable')
var net = require('net')

module.exports = function(ssb, feed) {
  return function (host, port) {
    var ps = pushable()

    // replicate with target
    console.log('connecting to',host,port)
    var stream = net.connect(port, host)
    var replStream = toStream(feed.createReplicationStream({ rel: 'follows', progress: function() { ps.push(arguments) } }, done))
    stream.on('error', function (err) {
      console.log('fail',err)
      ps.push(err)
      ps.end()
    })
    function done (err, sent, recv, expected) {
      console.log('done', arguments)
      if (err) ps.push(err)
      else ps.push([sent, recv, expected])
      ps.end()
    }
    stream.pipe(replStream).pipe(stream)

    return ps
  }
}
