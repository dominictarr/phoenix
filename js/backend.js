var net  = require('net');
var prpc = require('phoenix-rpc');
var cfg  = require('./common/config');

module.exports = function(cb) {
	var clientstream = prpc.client();
	var netstream = net.connect(+cfg.rpcport, function() {
		clientstream.pipe(netstream).pipe(clientstream);
		clientstream.api.close = function() { clientstream.end(); netstream.end(); };
		cb(null, clientstream.api);
	});
	netstream.on('error', function(err) {
		if (err.code != 'ECONNREFUSED') return cb(err);
		createServer(function(err, server) {
			if (err) return cb(err);

			var netstream = net.connect(+cfg.rpcport, function() {
				var clientstream = prpc.client();
				clientstream.pipe(netstream).pipe(clientstream);
				clientstream.api.close = function() { server.close(); clientstream.end(); netstream.end(); };
				cb(null, clientstream.api);
			})
		});
	});
};

function createServer(cb) {
	// Create server
	var server = net.createServer(function (s) { s.pipe(prpc.server(cfg)).pipe(s); });
	server.on('listening', function() { cb(null, server); });
	server.on('error', cb);
	server.listen(+cfg.rpcport, 'localhost');
}