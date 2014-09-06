var fs = require('fs')
var path = require('path')
var msgpack = require('msgpack')

function createHandler(divisor,noun){
  return function(diff, useAgo){
    var n = Math.floor(diff/divisor);
    return "" + n + noun + ((useAgo) ? ' ago' : '');
  }
}

var formatters = [
  { threshold: 1,        handler: function(){ return      "just now" } },
  { threshold: 60,       handler: createHandler(1,        "s") },
  { threshold: 3600,     handler: createHandler(60,       "m") },
  { threshold: 86400,    handler: createHandler(3600,     "h") },
  { threshold: 172800,   handler: function(){ return      "yesterday" } },
  { threshold: 604800,   handler: createHandler(86400,    "d") },
  { threshold: 2592000,  handler: createHandler(604800,   "w") },
  { threshold: 31536000, handler: createHandler(2592000,  "mo") },
  { threshold: Infinity, handler: createHandler(31536000, "y") }
];

exports.prettydate = function (date, useAgo) {
  var diff = (((new Date()).getTime() - date.getTime()) / 1000);
  for( var i=0; i<formatters.length; i++ ){
    if( diff < formatters[i].threshold ){
      return formatters[i].handler(diff, useAgo);
    }
  }
  throw new Error("exhausted all formatter options, none found"); //should never be reached
}

exports.read = function(file) { return fs.createReadStream(path.join(__dirname, '../../' + file)); }
exports.serve404 = function(res) { return function() { res.writeHead(404); res.end('Not found'); } }

exports.profileFetcher = function(backend) {
  var profiles = {};
  return function fetchProfile(msg, cb) {
    var author = msg.key ? msg.key : msg.author;
    var id = author.toString('hex');
    if (profiles[id]) {
      msg.nickname = (profiles[id] !== -1) ? profiles[id].nickname : '???';
      return cb(null, msg);
    }
    backend.profile_getProfile(author, function(err, profile) {
      if (err && !err.notFound) return console.error(err), cb(err);
      msg.nickname = (profile) ? profile.nickname : '???';
      profiles[id] = profile || -1;
      cb(null, msg);
    });
  }
}

var renderPlain =
exports.renderPlain = function(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(\r\n|\n)/g, '<br>')
}

exports.renderCtx = function(html, ctx) {
  for (var k in ctx)
    html = html.replace(RegExp('{'+k+'}', 'gi'), ctx[k])
  return html
}

exports.renderMsg = function(msg) {
  var content;
  switch (msg.type.toString()) {
    case 'init': content = '<strong><small>Account created</small></strong>'; break
    case 'text': content = renderPlain(msgpack.unpack(msg.message).plain); break
    case 'profile': content = '<strong><small>Is now known as ' + renderPlain(msgpack.unpack(msg.message).nickname) + '</small></strong>'; break
    default: content = '<em>Unknown message type: ' + renderPlain(msg.type.toString()); break
  }

  return '<tr>' +
    '<td class="content"><p><strong>' + renderPlain(msg.nickname) + '</strong> <small>' +  exports.prettydate(new Date(msg.timestamp)) + '</small></p>' +
    '<p>' + content + '</p></td>' +
  '</tr>';
}

exports.renderErr = function(err) {
  return '<p class="danger alert">' + err + '</p>'
}