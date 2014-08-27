var db     = require('../common/db');
var ssb    = require('../common/ssb');
var pull   = require('pull-stream');
var pl     = require('pull-level');
var appsDB = db.sublevel('apps', { valueEncoding: 'json' });
var lastDB = appsDB.sublevel('lst', { valueEncoding: 'json' });

var activeApps = {
	init:    require('./init')(appsDB.sublevel('app-init'), { valueEncoding: 'json' }),
	text:    require('./text')(appsDB.sublevel('app-text'), { valueEncoding: 'json' }),
	profile: require('./profile')(appsDB.sublevel('app-profile'), { valueEncoding: 'json' })
};

exports.get = function(name) { return activeApps[name]; };

exports.render = function(message, cb) {
	var app = activeApps[message.type.toString('utf8')];
	if (!app) return cb(new Error('No application available to process message type: ' + message.type.toString('utf8')));
	app.render(message, cb);
};

exports.create = function(type, data, cb) {
	var app = activeApps[type];
	if (!app) return cb(new Error('No application available to create message type: ' + type));
	app.create(data, function(err, message) {
		if (err) return cb(err);
		ssb.userFeed.add(type, message, cb);
	});
};

exports.clearCache = function(cb) {
	clearDB(lastDB, function(err) {
		if (err) return console.error('Error clearing apps/lastDB', err);
		var n = 0;
		for (var k in activeApps) {
			clearDB(appsDB.sublevel('app-'+k), done);
			n++;
		}
		function done(err) {
			n--;
			if (err) console.error(err);
			if (n === 0)
				cb();
		}
	});
};

exports.buildCache = function(opts, cb) {
	if (typeof opts == 'function')
		cb = opts, opts = 0;
	opts = opts || {};

	// Fetch sync positions for each app
	pull(pl.read(lastDB), pull.collect(function (err, items) {
		// Build into map
		var timestamps = {};
		(items||[]).forEach(function(item) { timestamps[item.key] = item.value; });

		// Initialize any new applications and decide where to start reading the log from
		var start = 1;
		for (var type in activeApps) {
			timestamps[type] = timestamps[type] || 1;
			if (start == 1 || timestamps[type] < start) {
				start = timestamps[type];
			}
		}
		console.log(start, timestamps);

		var createLogSink = pull.Sink(function (read) {
			read(null, function next (end, logentry) {
				if(end) return (cb) ? cb(end !== true ? end : undefined) : 0;
				var type = logentry.value.type.toString('utf8');

				// Get application
				var app = activeApps[type];
				if (!app) {
					console.warn('No application available to process message type: ', type);
					return read(null, next);
				}

				// Skip if processed
				if (timestamps[type] >= logentry.timestamp)
					return console.log('- skipping', type), read(null, next);
				console.log('- processing', type);

				// Let application process the message
				app.index(logentry.value, function(err) {
					if (err) {
						// application failure!
						// :TODO: how do we live with this?
						console.error('app ' + type + ' error', err);
					}

					// Update lastdb
					timestamps[type] = logentry.timestamp;
					lastDB.put(type, logentry.timestamp, function(err) {
						if (err) {
							// database error!
							// :TODO: how do we live with this?
							console.error('sync to lastdb error', err);
						}
						return read(null, next);
					});
				});
			});
		});

		// Begin listening to the log
		pull(ssb.createLogStream({ gt: start, tail: opts.tail }), createLogSink());
	}));
};

function clearDB(db, cb) {
	var ops = [];
	db.createKeyStream()
		.on('data', function (key) {
			ops.push({ type: 'del', key: key });
		})
		.on('end', function() {
			db.batch(ops, cb);
		});
}
