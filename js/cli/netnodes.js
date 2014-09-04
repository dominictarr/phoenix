var connect    = require('../backend');
var http       = require('http');

exports.addNode = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		if (!opts.host)
			return exports.syncNodes(opts, backend);

		var host = opts.host.split(':');
		var addr = host[0];
		var port = +host[1] || 64000;

		backend.addNode(addr, port, function(err) {
			if (err) console.error(err), backend.close();
			else exports.syncNodes(opts, backend);
		});
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

exports.syncNodes = function(opts, backend) {
	// Establish connections
	var m = 0, n = 0;
	function connectOut(host) {
		var startTs = +(new Date());
		var name = host[0] + ':' + host[1];
		console.log(name + ' connecting.');
		n++;

		var req = http.request({ method: 'CONNECT', hostname: host[0], port: host[1], path: '/' });
		req.on('connect', function(res, stream, head) {
			console.log(name + ' syncing.');
			var rs = backend.createReplicationStream();
			stream.pipe(rs).pipe(stream);
			stream.on('end', function() {
				console.log(name + ' synced. (' + (+(new Date()) - startTs) + 'ms)');
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
		});
		req.end();
	}
	function onSynced() {
		console.log('Ok');
		backend.close();
		/* :TODO:
		console.log('Fast-forwarding application cache.');
		require('./js/apps').buildCache(function(err) { 
			if (err) { return console.error(err); }
			console.log('Ok.');
		});*/
	}
	backend.getNodes(function(err, nodes) {
		if (err) return console.error(err), backend.close();
		if (nodes.length === 0) return console.log('No remote nodes known.\nOk.'), backend.close();
		nodes.forEach(connectOut);
	});
}