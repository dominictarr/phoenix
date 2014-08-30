var opts = require('secure-scuttlebutt/defaults');
var SSB  = require('secure-scuttlebutt');
var keys = require('./keys');
module.exports = SSB(require('./db'), opts);
module.exports.createUserFeed = function() { module.exports.userFeed = module.exports.createFeed(require('./keys')); };
if (keys.exist) {
	module.exports.createUserFeed();
}