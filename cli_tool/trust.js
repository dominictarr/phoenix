var connect    = require('../backend');

exports.verify = function(opts) {
	var rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

	var nickname = opts.nickname
	var hash = null
	var secret_words = null

	connect(function(err, backend) {
		if (err) return console.error(err);

		// Lookup the public key
		backend.profile_lookupByNickname(nickname, function(err, ids) {
			if (ids.length === 0)
				return console.log('No users nicknamed ' + nickname + ' found.'), rl.close(), backend.close()
			if (ids.length > 1) {
				console.log(ids.length, 'matches');
				// :TODO: disambiguation for multiple matches
				return rl.close(), backend.close()
			}
			hash = ids[0].toString('hex')
			
			console.log('Verifying \'' + nickname + '\' (' + hash + ').')
			console.log('')
			console.log('Phoenix will make some secret words for you.')
			console.log('You\'ll need to tell ' + nickname + ' these words in-person or over the phone.')
			rl.question('Is ' + nickname + ' present or on the phone? [y/n/Help] > ', handleIsPresent)
		});

		function phoneHelp() {
			console.log('')
			console.log('# What is this?')
			console.log('')
			console.log('Phoenix thinks that ' + nickname + '\'s account is ' + hash.slice(0, 16) + '...')
			console.log('To make sure, Phoenix is going to generate some secret words for you to read each other.')
			console.log('')
			console.log('MAKE SURE YOU KNOW YOU\'RE TELLING ' + nickname + ' THE SECRET WORDS.')
			console.log('Don\'t use instant-messenger. Don\'t use email. Don\'t use SMS.')
			console.log('Use the phone or meet in person!')
			console.log('')
			console.log('You need to hear ' + nickname + '\'s voice, or there\'s no point to doing this at all.')
			console.log('')
		}

		function handleIsPresent(input) {
			if (input.toLowerCase() == 'y' || input.toLowerCase() == 'yes') {
				connectToPeer()
			} else if (input.toLowerCase() == 'n' || input.toLowerCase() == 'no') {
				console.log('')
				console.log('You\'ll need to be in direct contact with ' + nickname + ' before running this command.')
				console.log('Please contact them directly and try again.')
				console.log('Aborted.')
				return rl.close(), backend.close()
			} else {
				phoneHelp()
				rl.question('Is ' + nickname + ' present or on the phone? [y/n/Help] > ', handleIsPresent)
			}
		}

		function connectToPeer() {
			console.log('')
			console.log('Finding ' + nickname + ' on the network...')
			// :TODO:
			var err = false
			if (err) {
				console.log('Failed to connect to ' + nickname + '. Make sure they are online and try again.')
				console.log('Aborted.')
			} else {
				console.log('Ok, found ' + nickname + '.')
				genSecret()
			}
		}

		function genSecret() {
			secret_words = 'todo' // :TODO:
			console.log('')
			console.log('Choosing secret words: ' + secret_words + '.')
			// :TODO: create hmac
			exchangeSecrets()
		}

		function exchangeSecrets() {
			console.log('Exchanging...')
			// :TODO:
			verifySecrets()
		}
		
		function verifySecrets() {
			var first = false // :TODO:
			if (first) {
				verifySelf(verifyOther)
			} else {
				verifyOther(verifySelf)
			}

			function verifySelf(cb) {
				console.log('')
				console.log('Have ' + nickname + ' read his secret words to you.')
				console.log('Enter them here, with a space separating each.')
				rl.question('' + nickname + '\'s words> ', function(input) {
					// :TODO: verify
					console.log('')
					console.log('Checking... Verified!')
					console.log('You now know ' + nickname + '\'s account is ' + hash + '.')
					cb(done)
				})
			}

			function verifyOther(cb) {
				console.log('')
				console.log('Now read your secret words to ' + nickname + ', in order:')
				console.log('')
				console.log('    ' + secret_words)
				console.log('')
				rl.question('Finished? [y/N] > ', function(input) {
					if (input.toLowerCase() != 'y' && input.toLowerCase() != 'yes')
						return verifyOther(cb)
					cb(done)
				})
			}
		}

		function done() {
			console.log('')
			console.log('Publishing verification...')
			// :TODO: publish verification
			console.log('Ok.')
			rl.close(), backend.close()
		}
	})
}