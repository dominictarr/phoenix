var osenv    = require('osenv');
var path     = require('path');

exports.sbhome   = path.join(osenv.home(), '.phoenix');
exports.namefile = path.join(exports.sbhome, 'secret.name');
exports.dbpath   = path.join(exports.sbhome, 'database');
