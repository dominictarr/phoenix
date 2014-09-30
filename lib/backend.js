var net  = require('net');
var prpc = require('phoenix-rpc');
var cfg  = require('./config');

var queue = null
module.exports = connect

function connect(cb) {
	// if there's a queue, get in
	if (queue !== null) {
		queue.push(cb)
		return
	}

	// try to connect
	var netstream = net.connect(+cfg.rpcport, function() {
		// connection successful
		var clientstream = prpc.client();
		clientstream.pipe(netstream).pipe(clientstream);
		clientstream.api.close = function() { clientstream.end(); netstream.end(); };
		cb(null, clientstream.api);

		// clear the queue
		setImmediate(drainQueue)
	});
	netstream.on('error', function(err) {
		if (err.code != 'ECONNREFUSED') return cb(err);
		// connection failed, start queuing
		if (queue === null) queue = []
		else return queue.push(cb)

		// create a server
		createServer(function(err, server) {
			if (err) return cb(err);

			// try again
			var netstream = net.connect(+cfg.rpcport, function() {
				// connection successful
				var clientstream = prpc.client();
				clientstream.pipe(netstream).pipe(clientstream);
				clientstream.api.close = function() { server.close(); clientstream.end(); netstream.end(); };
				cb(null, clientstream.api, clientstream);

				// clear the queue
				setImmediate(drainQueue)
			})
		});
	});
};

function drainQueue() {
	if (queue) {
		var q = queue
		queue = null
		if (q.length) {
			q.forEach(connect)
		}
	}
}

function createServer(cb) {
	// Create server
	var server = net.createServer(function (s) {
		s.on('error', function(err) { console.error('RPC server connection error', err) })
		s.pipe(prpc.server(cfg)).pipe(s);
	});
	server.on('listening', function() { cb(null, server); });
	server.on('error', cb);
	server.listen(+cfg.rpcport, 'localhost');
}