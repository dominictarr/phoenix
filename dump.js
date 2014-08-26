var db = require('level')(require('./js/common/config').dbpath, {
	keyEncoding: require('bytewise'),
	valueEncoding: require('secure-scuttlebutt/defaults').codec
});
db.createReadStream().on('data', console.log);