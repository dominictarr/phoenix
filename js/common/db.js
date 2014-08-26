var level    = require('level');
var sublevel = require('level-sublevel/bytewise');
var opts     = require('secure-scuttlebutt/defaults');

module.exports = sublevel(level(require('./config').dbpath, {
	valueEncoding: opts.codec
}));