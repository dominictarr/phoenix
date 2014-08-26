var db = require('./db');
var pl = require('pull-level');
var netNodesDB = db.sublevel('netnodes', { valueEncoding: 'json' });

exports.add = function(addr, port, cb) {
	netNodesDB.put([addr, port], [], cb);
};
exports.del = function(addr, port, cb) {
	netNodesDB.del([addr, port], cb);
};
exports.createListStream = function(cb, opts) {
	return pl.read(netNodesDB, opts);
};
exports.get = function(addr, port, cb) {
	netNodesDB.get([addr, port], cb);
};
