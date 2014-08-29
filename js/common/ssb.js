var opts = require('secure-scuttlebutt/defaults');
var SSB  = require('secure-scuttlebutt');
var keys = require('./keys');
module.exports = SSB(require('./db'), opts);
if (keys.exist) {
	module.exports.userFeed = module.exports.createFeed(require('./keys'));
}