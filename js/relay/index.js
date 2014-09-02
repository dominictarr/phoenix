var http     = require('http');
var fs       = require('fs');
var path     = require('path');
var hduplex  = require('http-duplex');
var toStream = require('pull-stream-to-stream');
var pull     = require('pull-stream');
var prpc     = require('phoenix-rpc');
var cfg      = require('../common/config');

function createServer(port) {
	prpc.createServerOrConnect(cfg, function(err, backend) {
		if (err) return console.error(err);

		// Sync config
		loadMembersFile(backend);

		// Start server
		var server = http.createServer(function (req, res) {
			function serve404(err) {  res.writeHead(404); res.end('Not found'); }
			fs.createReadStream(path.join(__dirname, '../../README.md')).on('error', serve404).pipe(res);
		});
		server.on('connect', function(req, stream, head) {
			console.log('Received CONNECT, replicating');
			stream.write('HTTP/1.1 200 Connection Established\r\n\r\n');
			stream.pipe(backend.createReplicationStream()).pipe(stream);
		});
		server.listen(port);

		// Establish connections
		function connectOut(host) {
			if ((host[0] == 'localhost' || host[0] == '127.0.0.1') && host[1] == port)
				return; // skip self

			var startTs = +(new Date());
			var name = host[0] + ':' + host[1];
			console.log('Connecting to ' + name);

			var req = http.request({ method: 'CONNECT', hostname: host[0], port: host[1], path: '/' });
			req.on('connect', function(res, stream, head) {
				console.log('Connected to ' + name + ', replicating');
				var rs = backend.createReplicationStream();
				stream.pipe(rs).pipe(stream);
				stream.on('end', function() {
					console.log(name + ' synced. (' + (+(new Date()) - startTs) + 'ms)');
				});
				/*
				:TODO: old version below with proper end() cb
				stream.pipe(toStream(ssb.createReplicationStream(function(err) {
					if (err) console.error(err);
					else console.log(name + ' synced. (' + (+(new Date()) - startTs) + 'ms)');
					if (++m == n) onSynced();
				}))).pipe(stream);*/
			});
			req.on('error', function(e) {
				console.log('Error connecting to ' + name + ': ' + e.message);
			});
			req.end();
		}

		backend.getNodes(function(err, nodes) {
			if (err) return console.error(err), backend.close();
			nodes.forEach(connectOut);
		});

		function onExit() { backend.close(); process.exit(); }
		process.on('SIGINT', onExit).on('SIGTERM', onExit);
	});
}

function loadMembersFile(backend) {
	fs.readFile(path.join(__dirname, '../../.relay-members'), 'utf8', function(err, data) {
		if (err || !data) return;
		data = data.replace(/\r/g, '').split('\n');
		data.forEach(function (key) {
			if (!key) return;
			try {
				key = new Buffer(key, 'hex');
			} catch (e) {
				console.error('Bad value found in .relay-members file.');
				console.error(e);
				return;
			}
			backend.follow(key);
		});
	});
}

module.exports = {
	createServer: createServer
};