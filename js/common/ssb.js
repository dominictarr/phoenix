var ssbCreate = require('secure-scuttlebutt/create');
module.exports = ssbCreate(require('./config').dbpath);