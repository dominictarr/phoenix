var shoe = require('shoe')
var prpc = require('phoenix-rpc')
var through = require('through')

var client = connectClient()
client.api.getKeys(function(err, keys) {
  console.log(keys)
})

function connectClient(cb) {
  // :TODO: shoe/sockjs makes it impossible to use a binary-encoded websocket
  //        it looks like there's some code somewhere that forces a conversion to string
  //        but I'm 99% sure that websockets could do binary without a base64 conversion
  //        and I'm 99% sure that would be faster! so let's do that
  var client = prpc.client()
  client
    .pipe(through(function(chunk) { this.queue(uint8arrayToBase64(chunk)) }))
    .pipe(shoe('/ws', cb))
    .pipe(through(function(chunk) { this.queue(base64toUint8array(chunk)) }))
    .pipe(client)
  return client
}

function uint8arrayToBase64(chunk) {
    var binary = ''
    var len = chunk.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(chunk[i])
    }
    return btoa(binary)
}

function base64toUint8array(chunk) {
    chunk = atob(chunk)
    var len = chunk.length;
    var bytes = new Uint8Array(len)
    for (var i = 0; i < len; i++)        {
        bytes[i] = chunk.charCodeAt(i)
    }
    return bytes
}