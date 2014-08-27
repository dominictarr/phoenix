var errors    = require('../common/errors');

module.exports = function(db) {
	var api = {};

	api.getPublicKey = function(userid, cb) {
		db.get(userid, {valueEncoding: 'binary'}, cb);
	};

	api.create = function (pubkey, cb) {
		// :TODO: validate pubkey?
		cb(null, pubkey); // pass through
	};

	api.index = function(msg, cb) {
		db.put(msg.author, msg.message, {valueEncoding: 'binary'}, cb);
	};

	api.render = function(msg, cb) {
		cb(null, 'Account created');
	};

	return api;
};