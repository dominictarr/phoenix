var db = (require('level')(require('./js/common/config').dbpath, {
	keyEncoding: require('bytewise'),
	valueEncoding: require('secure-scuttlebutt/defaults').codec
}));
// db.createReadStream().on('data', console.log);
db.createKeyStream().on('data', console.log);
// var netNodesDB = db.sublevel('netnodes', { valueEncoding: 'json' });
// netNodesDB.createReadStream().on('data', console.log).on('error', console.error);