var http = require('http');
var fs   = require('fs');
var path = require('path');
var cfg  = require('../common/config');

function createServer(port) {
	var server = http.createServer(function (req, res) {
		function serve404(err) {  res.writeHead(404); res.end('Not found'); }
		return fs.createReadStream(path.join(__dirname, '../../README.md')).on('error', serve404).pipe(res);
	});
	server.listen(port);
	return server;
}

module.exports = {
	createServer: createServer
};