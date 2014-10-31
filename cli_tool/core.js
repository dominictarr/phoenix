var cfg        = require('../lib/config')
var keys       = require('ssb-keys')
var level      = require('level')
var sublevel   = require('level-sublevel/bytewise')

function namefileHelp() {
	console.log('You don\'t have a profile yet. Run \'./phoenix setup\' first.')
}

function introHelp() {
	console.log('')
	console.log('Get started by running \'./phoenix serve\'')
	console.log('For help, use the -h switch')
	console.log('')
}

exports.setup = function(opts) {
	var nicknameRE = /^[A-z][0-9A-z_-]*$/;
	var nickname;
	var rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

	// key overwriting
	var keypair = keys.loadSync(cfg.namefile)
  if(keypair && !opts['force-new-keypair']) {
    console.error('Keyfile already exists.')
    console.log('')
    console.log('Use --force-new-keypair to destroy the old keyfile and create a new one.')
    console.log('(Warning: this will destroy your account!)')
    console.log('')
    rl.close()
    return
  }

	var opts = require('secure-scuttlebutt/defaults')
	var ssb = require('secure-scuttlebutt')(sublevel(level(cfg.dbpath, { valueEncoding: opts.codec }, handleDbOpen)), opts)
	function handleDbOpen(err) {
		if (err) {
			if (err.type == 'OpenError')
				console.error('Can not open the database because it is already open. If the phoenix server is running, please stop it first.')
			else if (err.type == 'InitializationError')
				console.error('Can not open the database because no path was found in the config. Please check that .phoenixrc contains a valid `datadir` setting.')
			else
				console.error(err.toString())
			rl.close()
			return
		}
		// setup profile
		rl.question('Nickname? > ', handleNickname);
	}
	function handleNickname(input) {
		if (!nicknameRE.test(input)) {
			console.log('Letters, numbers, dashes and underscores only. Must start with a letter.');
			return rl.close();
		}
		nickname = input;
		console.log('\nNickname is \'' + nickname + '\'');
		rl.question('Is this correct? [y/N]> ', handlePublish);
	}
	function handlePublish(input) {
		console.log('');
		rl.close();
		if (input.toLowerCase() != 'y')
			return console.log('Aborted.');

		// setup keys
		keys.create(cfg.namefile, function(err, keypair) {
			if (err) {
				console.error('Error creating keys:')
				console.error(err.toString())
				return
			}
			
			// publish profile
			var feed = ssb.createFeed(keypair)
			feed.add({ type: 'profile', nickname: nickname }, function(err) {
				if (err) return console.error('Failed to publish profile', err);
				console.log('Ok.');
				introHelp();
			})
		})
	}
}