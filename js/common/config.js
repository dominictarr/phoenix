var osenv    = require('osenv');
var path     = require('path');
var fs       = require('fs');

exports.setup = function(dir) {
	exports.sbhome   = dir;
	exports.namefile = path.join(exports.sbhome, 'secret.name');
	exports.dbpath   = path.join(exports.sbhome, 'database');
	try { fs.statSync(dir); }
	catch (e) { console.log(e);
		try { fs.mkdirSync(dir, 0755); }
		catch (e) {}
	}

}
exports.setup(path.join(osenv.home(), '.phoenix'));