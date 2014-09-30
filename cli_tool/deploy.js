#!/usr/bin/env node
var nomnom     = require('nomnom');
var ssh2       = require('ssh2');
var path       = require('path');
var cfg        = require('../lib/config');
var connect    = require('../lib/backend');

function namefileHelp() {
  console.log('You don\'t have a ~/.phoenix/secret.name yet; run \'phoenix setup\' first.');
}

exports.deploy = function(opts) {
  var dest = /^(.*)@(.*)(?:\:(.*))?$/.exec(opts.dest);
  if (!dest)
    return console.error('Destination must include the ssh user and hostname (eg bob@host.com)');

  var connInfo = {
    username: dest[1],
    host: dest[2],
    port: dest[3] || 22,
    password: undefined
  };

  connect(function(err, backend) {
    if (err) return console.error(err);

    backend.getKeys(function(err, keys) {
      if (err) return console.error(err), backend.close();
      if (!keys.exist) return namefileHelp(), backend.close();

      var deploySteps, deployErrors
      if (opts.reinstall) {
        deploySteps = [
          'cd ~/phoenix && node ~/phoenix/phoenix-relay stop',
          'rm -Rf ~/phoenix',
          'git clone https://github.com/pfraze/phoenix.git ~/phoenix',
          'cd ~/phoenix && npm install',
          'echo "' + (new Buffer(keys.name)).toString('hex') + '" > ~/phoenix/.relay-members',
          'cd ~/phoenix && node ./phoenix-relay start -d'
        ];
        deployErrors = [
          false,
          false,
          'Failed to clone phoenix repo.',
          'Failed to install dependencies.',
          'Failed to write your public key into the relay userlist.',
          'Failed to start the phoenix relay daemon.'
        ];
      } else if (opts.update) {
        deploySteps = [
          'cd ~/phoenix',
          'cd ~/phoenix && git pull',
          'cd ~/phoenix && npm install',
          'node ~/phoenix/phoenix-relay stop',
          'node ~/phoenix/phoenix-relay start -d'
        ];
        deployErrors = [
          'Deployment not found. Run without --update.',
          'Failed to pull latest version',
          'Failed to update dependencies.',
          false,
          'Failed to start the phoenix relay daemon.'
        ];
      } else {
        deploySteps = [
          'mkdir ~/phoenix',
          'git clone https://github.com/pfraze/phoenix.git ~/phoenix',
          'cd ~/phoenix && npm install',
          'echo "' + (new Buffer(keys.name)).toString('hex') + '" > ~/phoenix/.relay-members',
          'cd ~/phoenix && node ./phoenix-relay start -d'
        ];
        deployErrors = [
          'Already deployed. Run with --update or --reinstall.',
          'Failed to clone phoenix repo.',
          'Failed to install dependencies.',
          'Failed to write your public key into the allowed relay users.',
          'Failed to start the phoenix relay daemon.'
        ];

      }

      var conn = new ssh2();
      process.stdout.write('Password: ');
      getPassword(function(pass) {
        connInfo.password = pass;
        conn.connect(connInfo);
      });
      conn.on('ready', function() {
        console.log('Established ssh connection with ' + connInfo.host + ':' + connInfo.port + '.');
        sshDoAll(deploySteps, deployErrors, function() {
          if (opts.update) {
            console.log('\nOk.')
            return backend.close()
          }
          console.log('');
          console.log('Access granted:');
          console.log('- "Member." You can sync anybody\'s feed to ' + connInfo.host + '.');
          console.log('- "Syncing." Background-syncing with ' + connInfo.host + '.');
          backend.addNode(connInfo.host, 64000, function(err) {
            if (err) {
              console.error('Failed to store '+ connInfo.host + ' into your server-table.');
              console.error('Try again by calling \'phoenix sync ' + connInfo.host + '\'');
            }
            console.log('Ok.');
            backend.close();
          });
        });
      });
      conn.on('error', function(err) {
        console.error('Failed to establish ssh connection with ' + connInfo.host + ':' + connInfo.port + '.');
        console.error(err.toString());
        backend.close();
      });

      function sshDoAll(cmds, errors, cb) {
        next();
        function next() {
          var cmd = cmds.shift();
          var errMsg = errors.shift();
          var ignoreFailure = (errMsg === false);
          sshDo(cmd, function(err) {
            if (err && !ignoreFailure) return conn.end(), backend.close(), console.error(errMsg);
            if (cmds.length) next();
            else conn.end(), cb();
          });
        }
      }
      function sshDo(cmd, cb) {
        console.log('> ', cmd);
        conn.exec(cmd, function(err, stream) {
          if (err) throw err;
          stream
            .on('exit', function(code, signal) {
              if (code !== 0) {
                return cb(new Error('Process exited with error code ' + code));
              }
              cb();
            })
            .on('data', function(data) {
              process.stdout.write(data);
            })
            .stderr.on('data', function(data) {
              process.stderr.write(data);
            });
        });
      }
    });
  });
}

function getPassword(cb) {
  var stdin = process.openStdin();
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);
  var password = '';
  process.stdin.on('data', function (char) {
    char = char + "";

    switch (char) {
      case "\n": case "\r": case "\u0004":
        // They've finished typing their password
        process.stdin.setRawMode(false);
        stdin.pause();
        console.log('');
        cb(password);
        break;
      case "\u0003":
        // Ctrl C
        console.log('\nCancelled');
        process.exit();
        break;
      default:
        password += char;
        break;
    }
  });
}
