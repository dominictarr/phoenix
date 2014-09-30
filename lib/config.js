var osenv    = require('osenv');
var path     = require('path');
var fs       = require('fs');

// Read cfg
var cfg = require('rc')('phoenix', {
	datadir: './.phoenix',
	rpcport: 64050
});

// Handle relative paths
// TODO - better solution?
//  - path.resolve seems to handle relative paths, but probably using process.cwd, which is inconsistent
//  - for ~/, I can't find an api to resolve it to home, and leaving it as ~/ causes issues
if (cfg.datadir.slice(0, 2) == './' || cfg.datadir.slice(0, 3) == '../')
	cfg.datadir = path.join(__dirname, '../../', cfg.datadir);
if (cfg.datadir.slice(0, 2) == '~/')
	cfg.datadir = path.join(osenv.home(), cfg.datadir.slice(2));

// Build dependent values
cfg.namefile = path.join(cfg.datadir, 'secret.name');
cfg.dbpath   = path.join(cfg.datadir, 'database');

// Make sure the datadir exists
try { fs.statSync(cfg.datadir); }
catch (e) {
	try { fs.mkdirSync(cfg.datadir, 0755); }
	catch (e) {}
}

module.exports = cfg;