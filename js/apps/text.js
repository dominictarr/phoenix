var errors    = require('../common/errors');

module.exports = function(db) {
	var api = {};

	api.create = function (text, cb) {
		cb(null, text); // pass through
	};

	api.index = function(msg, cb) {
		cb();
	};

	api.render = function(msg, cb) {
		cb(null, '> ' + msg.message);
	};

	return api;
};