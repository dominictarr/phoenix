var http    = require('http');
var prpc    = require('phoenix-rpc');
var connect = require('../lib/backend');
var util    = require('../lib/util');

exports.addNode = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		if (!opts.host)
			return backend.syncNetwork(onSynced);

		var host = util.splitAddr(opts.host);
		var addr = host[0];
		var port = +host[1] || 80;

		backend.addNode(addr, port, function(err) {
			if (err) console.error(err), backend.close();
			else backend.syncNetwork(onSynced);
		});

		function onSynced(err, results) {
			if (err)
				console.error(err)
			else {
				for (var host in results) {
					var result = results[host]
					if (result.error)
						console.log(host, 'error:', result.msg)
					else
						console.log(host, 'synced in', result.elapsed, 'ms')
				}
				console.log('Ok');
			}
			backend.close();
		}
	});
}

exports.delNode = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);
	
		var host = util.splitAddr(opts.host);
		var addr = host[0];
		var port = +host[1] || 80;

		console.log('Removing', addr, port);

		backend.delNode(addr, port, function(err) {
			if (err) console.error(err);
			else console.log('Ok.');
			backend.close();
		});
	});
}