(function() {
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
})()

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

var escapePlain =
exports.escapePlain = function(str) {
  return (str||'')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

exports.renderCtx = function(html, ctx) {
  for (var k in ctx)
    html = html.replace(RegExp('{'+k+'}', 'gi'), ctx[k])
  return html
}

exports.renderErr = function(err) {
  return '<p class="danger alert">' + err + '</p>'
}

exports.toHexString = function(buff) {
  if (Buffer.isBuffer(buff)) return buff.toString('hex')
  // may be a typed array (in browsers) try converting:
  return (new Buffer(buff||'', 'hex')).toString('hex')
}
exports.toBuffer = function(v) {
  if (typeof v == 'string') return new Buffer(v, 'hex')
  return new Buffer(v)
}

// concurrency queue: groups simultaneous async calls to avoid redundant round-trips
// - produces a queue function with signature: function(key:String, callback:Function, behavior:Function(drain:function))
// - first time queue function is called for a given key, runs `behavior` immediately, giving it the `drain` cb
// - until `behavior` calls drain, all other calls to the queue of the same `key` will have their cb be added to the queue
// - when `behavior` does call `drain`, all the queued cbs will be run with the given values, and the queue for the given `key` is reset
/*
var n = 0
var q = util.queue() // create a new queue
function someAsync(key, cb) {
  // enter the queue
  q(key, cb, function(drain) {
    // do async
    setTimeout(function() { drain(null, ++n) }, 5000)
  })
}
someAsync('foo', console.log) // emits 1 after 5s
someAsync('foo', console.log) // emits 1 after 5s
someAsync('foo', console.log) // emits 1 after 5s
someAsync('bar', console.log) // emits 2 after 5s
*/
exports.queue = function() {
  var q = {}
  return function(key, cb, fn) {
    cb = cb || function(){}

    // try to add to the queue
    if (q[key])
      return q[key].push(cb)

    // create the queue instance
    q[key] = [cb]
    fn(function() {
      // clear the queue
      var qq = q[key]
      q[key] = null

      // run all fns
      var args = Array.prototype.slice.call(arguments)
      for (var i=0; i < qq.length; i++)
        qq[i].apply(null, args)
    })
  }
}

exports.splitAddr = function(addr) {
  if (addr[0] == '[') {
    // ipv6 address
    var i = addr.indexOf(']')
    return [addr.substr(1, i-1), addr.substr(i+2)]
  } else {
    return addr.split(':')
  }
}