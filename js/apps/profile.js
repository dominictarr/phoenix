var errors    = require('../common/errors');

var schema = {
	nickname: 'string'
};

module.exports = function(db) {
	var api = {};

	api.getProfile = function(userid, cb) {
		db.get([userid, 'profile'], cb);
	};

	api.lookupByNickname = function(nickname, cb) {
		var ids = [];
		nickname = nickname.toLowerCase();
		db.createReadStream()
			.on('data', function(item) {
				if (item.value.nickname.toLowerCase() == nickname)
					ids.push(item.key[0]);
			})
			.on('end', function() {
				cb(null, ids);
			});
	};

	api.create = function (prof, cb) {
		if (!prof || !prof.nickname) return cb(new errors.BadInput({ schema: schema }));
		// For now, only nickname
		cb(null, JSON.stringify({nickname: prof.nickname}));
	};

	function parse(data, cb) {
		var profile;
		try { profile = JSON.parse(data.message.toString('utf8')); }
		catch (e) { return cb(new errors.BadInput({ encoding: 'json' })); }
		if (!profile.nickname) { return cb(new errors.BadInput({ schema: schema })); }
		cb(null, profile);
	}

	api.index = function(msg, cb) {
		parse(msg, function(err, profile) {
			if (err) return cb(err);
			db.put([msg.author, 'profile'], profile, cb);
		});
	};

	api.render = function(msg, cb) {
		parse(msg, function(err, profile) {
			if (err) return cb(err);
			cb(null, 'Is now known as **' + profile.nickname + '**');
		});
	};

	return api;
};