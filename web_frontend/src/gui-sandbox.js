var MRPC = require('muxrpc')
var pull = require('pull-stream')
var pushable = require('pull-pushable')
var manifest = require('./lib/gui-sandbox-rpc-manifest')

// define local api
window.guipost = MRPC(manifest.container, manifest.iframe)({
  inject: function(html, cb) {
    // add content
    var div = document.createElement('div')
    div.innerHTML = html
    document.body.appendChild(div)

    // run scripts
    var scripts = div.querySelectorAll('script')
    for (var i=0; i < scripts.length; i++) {
      scripts[i].parentNode.removeChild(scripts[i])
      var script = document.createElement('script')
      script.innerHTML = scripts[i].innerHTML
      div.appendChild(script)
    }

    cb()
  }
})

// wire up the rpc stream
var rpcStream = guipost.createStream()

// in
var rpcPush = pushable()
pull(rpcPush, rpcStream.sink)
window.addEventListener('message', function(e) {  
  rpcPush.push(e.data)  
}, false);

// out
pull(rpcStream.source, pull.drain(function(chunk) {
  parent.postMessage(chunk, '*')
}))

// signal RPC is connected
guipost.ready(function(){})