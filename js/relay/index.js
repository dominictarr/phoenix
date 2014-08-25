var http  = require('http');
var fs   = require('fs');
var cfg   = require('../common/config');

function createServer(port) {
	var server = http.createServer(function (req, res) {
		function serve404() {  res.writeHead(404); res.end('Not found'); }
		return fs.createReadStream('./README.md').on('error', serve404).pipe(res);
	});
	server.listen(port);
	return server;
}

module.exports = {
	createServer: createServer
};