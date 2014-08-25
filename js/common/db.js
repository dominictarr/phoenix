var level = require('level');
exports = level(require('./config').dbpath, {valueEncoding: 'binary'});