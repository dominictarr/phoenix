var connect    = require('../backend');
var prettydate = require('pretty-date');
var pull       = require('pull-stream');
var toPull     = require('stream-to-pull-stream');

function padleft(width, str) {
	if (str.length < width) {
		return '                                        '.slice(0, width - str.length) + str;
	}
	return str;
}

function namefileHelp() {
	console.log('You don\'t have a secret.name yet; run \'phoenix setup\' first.');
}

function introHelp() {
	console.log('');
	console.log('Getting started:');
	console.log('');
	console.log(' - Follow feeds with \'phoenix add <public key>\'');
	console.log(' - Post messages with \'phoenix post "<your message>"\'');
	console.log(' - Add hosts to your network with \'phoenix sync <host address>\'');
	console.log(' - Get more help with \'phoenix -h\'');
	console.log('');
}

exports.setup = function(opts) {
	var nicknameRE = /^[A-z][0-9A-z_-]*$/;
	var nickname;
	var rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

	// :TODO: dont publish new profile if one already exists

	connect(function(err, backend) {
		if (err) return console.error(err);

		// Setup profile
		rl.question('Nickname? > ', handleNickname);
		function handleNickname(input) {
			if (!nicknameRE.test(input)) {
				console.log('Letters, numbers, dashes and underscores only. Must start with a letter.');
				return rl.close(), backend.close();
			}
			nickname = input;
			console.log('\nNickname is \'' + nickname + '\'');
			rl.question('Publish? [y/N]> ', handlePublish);
		}
		function handlePublish(input) {
			console.log('');
			rl.close();
			if (input.toLowerCase() != 'y')
				return console.log('Aborted.'), backend.close();

			// Setup keys
			backend.createKeys(opts['force-new-keypair'], handleKeycreate);
		}
		function handleKeycreate(err) {
			if (err && err.fatal)
				return console.error(err.toString()), backend.close();

			// Publish profile
			backend.profile_setNickname(nickname, handleProfpublish);
		}
		function handleProfpublish(err) {
			if (err) return console.error('Failed to publish profile', err);
			console.log('Ok.');
			introHelp();
			backend.close();
		}
	});
}

exports.list = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		var profiles = {};
		function fetchProfile(msg, cb) {
			var id = msg.author.toString('hex');
			if (profiles[id]) {
				msg.nickname = profiles[id].nickname;
				return cb(null, msg);
			}
			backend.profile_getProfile(id, function(err, profile) {
				if (err) return console.error(err), cb(err);
				msg.nickname = (profile) ? profile.nickname : '???';
				profiles[id] = profile;
				cb(null, msg);
			});
		}

		var hadMessages = false;
		function toDetailed (msg) {
			hadMessages = true;
			var author = msg.author.toString('hex');
			console.log (
				//proquint.encodeCamelDash(msg.author).substring(0, 43) + ' / ' +
				author.slice(0, 12) + '...' + author.slice(-4) + ' / ' +
				msg.sequence + '\n' +
				msg.type.toString('utf8') + ' : '+
				new Date(msg.timestamp).toISOString() + '\n' +
				( msg.type.toString('utf8') == 'init'
				? msg.message.toString('hex') + '\n'
				: msg.message.toString('utf8') + '\n' )
			);
		}
		function toSimple(msg) {
			if (!hadMessages) console.log('user   seq   time             nickname     message');
			hadMessages = true;
			var markdown = (msg.type.toString() == 'init') ? ('Account created: ' + msg.message.toString('hex').slice(0,16) + '...') : msg.message.toString();
			var author = msg.author.toString('hex');
			var output =
				author.slice(0, 4) + ' | ' +
				padleft(3, ' '+msg.sequence) + ' | ' +
				padleft(14, prettydate.format(new Date(msg.timestamp))) + ' | ' +
				padleft(10, msg.nickname) + ' | ' +
				markdown
			;
			console.log(output);
		}

		backend.getKeys(function(err, keys) {
			if (keys.exist) {
				pull(
					toPull(backend.createFeedStream({ tail: opts.tail })),
					pull.asyncMap(fetchProfile),
					pull.drain((opts.long) ? toDetailed : toSimple, function() {
						if (!hadMessages) {
							console.log('No messages in your feed.');
							introHelp();
						}
						backend.close();
					})
				);
			} else {
				console.log('This appears to be your first time using Phoenix (no keyfile found). Running setup.')
				backend.close();
				exports.setup(opts);
			}
		})
	});
}

exports.post = function(opts) {
	connect(function(err, backend) {
		if (err) return console.error(err);

		backend.getKeys(function(err, keys) {
			if (err) return console.error(err), backend.close();
			if (!keys.exist) return namefileHelp(), backend.close();
			backend.text_post(opts.text, function(err) {
				if (err) console.error(err);
				else console.log('Ok.');
				backend.close();
			});
		});
	});
}