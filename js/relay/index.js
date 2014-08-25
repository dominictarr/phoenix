var http  = require('http');
var cfg   = require('../common/config');

function createServer(port) {
	var server = http.createServer(function (req, res) {
		res.writeHead(200); res.end('Relay server');
	});
	server.listen(port);
	return server;
}

module.exports = {
	createServer: createServer
};