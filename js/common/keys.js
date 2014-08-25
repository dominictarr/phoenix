var fs       = require('fs');
var crypto   = require('crypto');
var proquint = require('proquint-');
var ecc      = require('eccjs');
var k256     = ecc.curves.k256;
var Blake2s  = require('blake2s');
var cfg      = require('./config');

function bsum (value) {
	return new Blake2s().update(value).digest();
}

try {
	var privateKey = proquint.decode(fs.readFileSync(cfg.namefile, 'ascii').replace(/\s*\#[^\n]*/g, ''));
	var keys = ecc.restore(k256, privateKey);
	exports.private = keys.private;
	exports.public  = keys.public;
	exports.name    = bsum(keys.public);
	exports.exist   = true;
} catch (e) {
	exports.private = null;
	exports.public  = null;
	exports.name    = null;
	exports.exist   = false;
}

exports.create = function(force, cb) {
	if(exports.exist && !force) {
		var err = new Error('Namefile already exists, use --force-new-keypair to overwrite it.');
		err.fatal = false;
		return cb(err);
	}

	var privateKey = crypto.randomBytes(32);
	var keys       = ecc.restore(k256, privateKey);
	var name       = bsum(keys.public);

	var contents = [
	'# this is your SECRET name.',
	'# this name gives you magical powers.',
	'# with it you can mark your messages so that your friends can verify',
	'# that they really did come from you.',
	'#',
	'# if any one learns this name, they can use it to destroy your identity',
	'# NEVER show this to anyone!!!',
	'',
	proquint.encodeCamelDash(keys.private),
	'',
	'# notice that it is quite long.',
	'# it\'s vital that you do not edit your name',
	'# instead, share your public name',
	'# your public name: ' + proquint.encode(name),
	'# or as a hash : ' + name.toString('hex')
	].join('\n');

	fs.writeFile(cfg.namefile, contents, function(err) {
		if (err) {
			err.fatal = true;
		} else {
			exports.private = keys.private;
			exports.public  = keys.public;
			exports.name    = name;
			exports.exist   = true;
		}
		cb(err);
	});
};

exports.sign = function(buffer) {
	var hash = crypto.createHash('sha256').update(buffer).digest();
	return ecc.sign(k256, exports.private, hash);
};

exports.verify = function(buffer, sig, key) {
	if (!key) key = exports.public;
	var hash = crypto.createHash('sha256').update(buffer).digest();
	return ecc.verify(k256, key, sig, hash);
};