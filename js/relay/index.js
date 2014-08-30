var http     = require('http');
var fs       = require('fs');
var path     = require('path');
var hduplex  = require('http-duplex');
var toStream = require('pull-stream-to-stream');
var pull     = require('pull-stream');
var cfg      = require('../common/config');
var ssb      = require('../common/ssb');
var netnodes = require('../common/network-nodes');

function createServer(port) {
	// Sync config
	loadMembersFile();

	// Start server
	var server = http.createServer(function (req, res) {
		function serve404(err) {  res.writeHead(404); res.end('Not found'); }
		fs.createReadStream(path.join(__dirname, '../../README.md')).on('error', serve404).pipe(res);
	});
	server.on('connect', function(req, stream, head) {
		console.log('Received CONNECT, replicating');
		stream.write('HTTP/1.1 200 Connection Established\r\n\r\n');
		stream.pipe(toStream(ssb.createReplicationStream(function(err) { console.log('fin', err); }))).pipe(stream);
	});
	server.listen(port);

	// Establish connections
	function connectOut(node) {
		var host = node.key;
		if ((host[0] == 'localhost' || host[0] == '127.0.0.1') && host[1] == port)
			return; // skip self

		var name = host[0] + ':' + host[1];
		console.log('Connecting to ' + name);

		var req = http.request({ method: 'CONNECT', hostname: host[0], port: host[1], path: '/' });
		req.on('connect', function(res, stream, head) {
			console.log('Connected to ' + name + ', replicating');
			stream.pipe(toStream(ssb.createReplicationStream(function(err) { console.log('fin', err); }))).pipe(stream);
		});
		req.on('error', function(e) {
			console.log('Error connecting to ' + name + ': ' + e.message);
		});
		req.end();
	}
	pull(
		netnodes.createListStream(),
		pull.through(connectOut),
		pull.drain()
	);

	return server;
}

function loadMembersFile() {
	fs.readFile(path.join(__dirname, '../../.relay-members'), 'utf8', function(err, data) {
		console.log(err, data);
		if (err || !data) return;
		data = data.replace(/\r/g, '').split('\n');
		data.forEach(function (key) {
			try {
				key = new Buffer(key, 'hex');
			} catch (e) {
				console.error('Bad value found in .relay-members file.');
				console.error(e);
				return;
			}
			ssb.follow(key);
		});
	});
}

module.exports = {
	createServer: createServer
};