var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var msgpack = require('msgpack')
var concat = require('concat-stream')

function createHandler(divisor,noun){
  return function(diff){
    var n = Math.floor(diff/divisor);
    return "" + n + noun;
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
  { threshold: 31536000, handler: createHandler(2592000,  "m") },
  { threshold: Infinity, handler: createHandler(31536000, "y") }
];

var prettydate = {
  format: function (date) {
    var diff = (((new Date()).getTime() - date.getTime()) / 1000);
    for( var i=0; i<formatters.length; i++ ){
      if( diff < formatters[i].threshold ){
        return formatters[i].handler(diff);
      }
    }
    throw new Error("exhausted all formatter options, none found"); //should never be reached
  }
}

function read(file) { return fs.createReadStream(path.join(__dirname, '../../' + file)); }
function serve404() {  res.writeHead(404); res.end('Not found'); }

function profileFetcher(backend) {
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

function renderCtx(html, ctx) {
  for (var k in ctx)
    html = html.replace(RegExp('{'+k+'}', 'gi'), ctx[k])
  return html
}

function renderMsg(msg) {
  var content;
  switch (msg.type.toString()) {
    case 'init': content = '<strong><small>Account created</small></strong>'; break
    case 'text': content = msgpack.unpack(msg.message).plain; break
    case 'profile': content = '<strong><small>Is now known as ' + msgpack.unpack(msg.message).nickname + '</small></strong>'; break
    default: content = '<em>Unknown message type: ' + msg.type.toString(); break
  }

  return '<tr>' +
    '<td class="content"><p><strong>' + msg.nickname + '</strong> <small>' +  prettydate.format(new Date(msg.timestamp)) + '</small></p>' +
    '<p>' + content + '</p></td>' +
  '</tr>';
}

function renderErr(err) {
  return '<p class="danger alert">' + err + '</p>'
}

function renderPage(req, res, backend, ctx) {
  read('html/feeds.html').on('error', serve404).pipe(concat(function(html) {
    var n = 0
    var fetchProfile = profileFetcher(backend)

    pull(
      toPull(backend.createFeedStream({reverse: true})),
      pull.asyncMap(fetchProfile),
      pull.collect(function (err, entries) {
        if (err) { return console.error(err), res.writeHead(500).end() }
        ctx.feed_entries = entries.map(renderMsg).join('')
        if (++n == 2) finish()
      })
    )

    pull(
      toPull(backend.following()),
      pull.asyncMap(fetchProfile),
      pull.collect(function (err, entries) {
        if (err) { return console.error(err), res.writeHead(500).end() }
        ctx.friends = entries.map(function(entry) { return '<a href="/profile/'+entry.key.toString('hex')+'">'+entry.nickname+'</a><br>'; }).join('')
        if (++n == 2) finish()
      })
    )

    function finish() {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(renderCtx(html.toString(), ctx))
    }
  }))
}

exports.get = function(req, res, backend) {
  renderPage(req, res, backend, { error: '' })
}

exports.post = function(req, res, backend) {
  req.pipe(concat(function(form) {

    var form = require('querystring').parse(form.toString())
    if (form && form.plain) {
      backend.text_post(form.plain, serve)
    } else {
      serve(new Error('Cant post an empty message'))
    }

    function serve(err) {
      renderPage(req, res, backend, { error: (err) ? err.toString() : '' })
    }
  }))
}