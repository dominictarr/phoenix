var http = require('http');
var fs = require('fs');

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