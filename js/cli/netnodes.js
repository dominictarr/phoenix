var http    = require('http');
var prpc    = require('phoenix-rpc');
var connect = require('../backend');
var sync    = require('../common/sync')

exports.addNode = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		if (!opts.host)
			return sync(backend, onSynced);

		var host = opts.host.split(':');
		var addr = host[0];
		var port = +host[1] || 64000;

		backend.addNode(addr, port, function(err) {
			if (err) console.error(err), backend.close();
			else sync(backend, onSynced);
		});

		function onSynced() {
			console.log('Ok');
			backend.close();
		}
	});
}

exports.delNode = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);
	
		var host = opts.host.split(':');
		var addr = host[0];
		var port = +host[1] || 64000;

		console.log('Removing', addr, port);

		backend.delNode(addr, port, function(err) {
			if (err) console.error(err);
			else console.log('Ok.');
			backend.close();
		});
	});
}