var localhost = require('./js/localhost');
if (!global.server) {
	global.server = localhost.createServer(65000);
	global.server.on('listening', notify.bind(null, 'Phoenix is now hosting privately at localhost:65000'));
	global.server.on('error', function() {
		// :TODO: give better error messages
		notify('Phoenix server failed to load');
	});
}

function notify(text) {
	new Notification('Phoenix', { body: text, iconUrl: 'img/icon.png', icon: 'img/icon.png' });
}