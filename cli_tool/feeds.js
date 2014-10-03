var connect    = require('../lib/backend');
var pull       = require('pull-stream');
var toPull     = require('stream-to-pull-stream');

function namefileHelp() {
	console.log('You don\'t have a profile yet. Run \'node phoenix setup\' first.');
}

function padright(width, str) {
	if (str.length < width) {
		return str + '                                        '.slice(0, width - str.length);
	}
	return str;
}

exports.whoami = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		backend.getKeys(function(err, keys) {
			if (err) return console.error(err), backend.close()
			if (keys.exist) {
				console.log('You are:    ' + keys.name.toString('hex'));
				console.log('Public key: ' + keys.public.toString('hex'));
			} else {
				namefileHelp();
			}
			backend.close();
		});
	});
}

exports.feeds = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		var profiles = {};
		function fetchProfile(entry, cb) {
			var id = entry.key.toString('hex');
			if (profiles[id]) {
				entry.nickname = profiles[id].nickname;
				return cb(null, entry);
			}
			backend.profile_getProfile(entry.key, function(err, profile) {
				if (err && !err.notFound) return console.error(err), cb(err);
				entry.nickname = (profile) ? profile.nickname : '???';
				profiles[id] = profile;
				cb(null, entry);
			});
		}

		pull(
			toPull(backend.following()),
			pull.asyncMap(fetchProfile),
			pull.collect(function(err, entries) {
				if (err) { return console.error(err); }
				console.log ('  nickname   id');
				entries.forEach(function(entry, i) {
					console.log((i+1) + ' ' + padright(10, entry.nickname) + ' ' + entry.key.toString('hex'));
				});
				backend.close();
			})
		);
	});
}

exports.lookup = function(opts) {
	var name = opts.name;
	connect(function(err, backend) {
		if (err) return console.error(err);

		function output(id, cb) {
			if (opts.pubkey) {
				backend.getPublicKey(id, function(err, pubkey) {
					if (err) { return cb(err); }
					console.log(pubkey.toString('hex'));
					cb(null);
				});
			} else {
				console.log(id.toString('hex'));
				cb(null);
			}
		}

		if (+name == name) {
			// numeric
			var id = (+name - 1);
			pull(
				ssb.following(),
				pull.collect(function(err, entries) {
					if (err) { return console.error(err); }
					var entry = entries[id];
					if (!entry) { return console.error('Invalid user number.'); }
					output(entry.key, function(err) {
						if (err) console.error(err)
						else console.log('Ok.')
						backend.close()
					});
				})
			);
		} else {
			backend.profile_lookupByNickname(name, function(err, ids) {
				if (ids.length === 0)
					return console.log('No users nicknamed '+name+' found.'), backend.close()
				if (ids.length > 1)
					console.log(ids.length, 'matches');
				var n=0;
				ids.forEach(function(id) {
					output(id, function(err) {
						if (err) return n = -1, backend.close(), console.error(err)
						if (++n == ids.length) {
							console.log('Ok.')
							backend.close()
						}
					})
				});
			});
		}
	})
}

exports.follow = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);
		// Validate key
		// :TODO:

		// Add to follow list
		backend.follow(new Buffer(opts.key, 'hex'), function(err) {
			if (err) {
				console.error(err);
			} else {
				console.log('Ok.');
			}
			backend.close();
		});
	});
}

exports.unfollow = function(opts) {
	var name = opts.name;
	connect(function(err, backend) {
		if (err) return console.error(err);

		function doit(key) {
			// Remove from follow list
			backend.unfollow(key, function(err) {
				if (err) {
					console.error(err);
				} else {
					console.log('Ok.');
				}
				backend.close();
			});
		}

		if (+name == name) {
			// numeric
			var id = (+name - 1);
			pull(
				toPull(backend.following()),
				pull.collect(function(err, entries) {
					if (err) { return console.error(err); }
					var entry = entries[id];
					if (!entry) { return console.error('Invalid user number.'); }
					doit(entry.key);
				})
			);
		} else {
			backend.profile_lookupByNickname(name, function(err, ids) {
				if (ids.length === 0)
					console.log('No users nicknamed '+name+' found.')
				else {
					if (ids.length > 1)
						console.log(ids.length, 'matches');
					ids.forEach(doit);
					console.log('Ok.');
				}
				backend.close();
			});
		}
	});
}