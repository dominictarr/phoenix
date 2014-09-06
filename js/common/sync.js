var http    = require('http');
var prpc    = require('phoenix-rpc');

module.exports = function(localBackend, cb) {
  // Establish connections
  var m = 0, n = 0;
  function connectOut(host) {
    var startTs = +(new Date());
    var name = host[0] + ':' + host[1];
    console.log(name + ' connecting.');
    n++;

    var req = http.request({ method: 'CONNECT', hostname: host[0], port: host[1], path: '/' });
    req.on('connect', function(res, conn, head) {
      console.log(name + ' syncing.');

      var remoteRpcStream = prpc.client();
      remoteRpcStream.pipe(conn).pipe(remoteRpcStream);

      var rsRemote = remoteRpcStream.api.createReplicationStream();
      var rsLocal = localBackend.createReplicationStream();
      rsLocal.pipe(rsRemote).pipe(rsLocal);
      rsRemote.on('end', function() {
        console.log(name + ' synced. (' + (+(new Date()) - startTs) + 'ms)');
        conn.end()
        if (++m == n) onSynced();
      });
      /*
      :TODO: old version below with proper end() cb
      stream.pipe(toStream(ssb.createReplicationStream(function(err) {
        if (err) console.error(err);
        else console.log(name + ' synced. (' + (+(new Date()) - startTs) + 'ms)');
        if (++m == n) onSynced();
      }))).pipe(stream);*/
      // :TODO: spit out some metrics, like # of new messages
    });
    req.on('error', function(e) {
      console.log(name + ' failed, ' + e.message);
      if (++m == n) onSynced();
    });
    req.end();
  }
  function onSynced() {
    cb()
    /* :TODO:
    console.log('Fast-forwarding application cache.');
    require('./js/apps').buildCache(function(err) { 
      if (err) { return console.error(err); }
      console.log('Ok.');
    });*/
  }
  localBackend.getNodes(function(err, nodes) {
    if (err) return console.error(err), localBackend.close();
    if (nodes.length === 0) return console.log('No remote nodes known.\nOk.'), localBackend.close();
    nodes.forEach(connectOut);
  });
}