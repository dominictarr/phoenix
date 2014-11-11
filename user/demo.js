var pull = require('pull-stream')
var JSONH = require('json-human-buffer')

document.body.innerHTML += '<h1 style="margin-top:0">Your Feed</h1>'
document.body.innerHTML += '<p><button onclick="post()">Post "hello from demo.js" to your feed</button></p>'

window.post = function () {
  phoenix.add({ type: 'post', postType: 'text', text: 'hello from demo.js' })
}

pull(
  phoenix.createFeedStream(),
  pull.drain(function(msg) {
    // add to doc
    document.body.innerHTML += '<pre>'+JSONH.stringify(msg, null, 2).replace(/</g, '&lt;').replace(/>/, '&gt;')+'</pre>'
  }, function() {
    // resize iframe
    var body = document.body,
    html = document.documentElement;
    var height = Math.max( body.scrollHeight, body.offsetHeight, 
                           html.clientHeight, html.scrollHeight, html.offsetHeight );
    phoenix.setIframeHeight(height + 'px', function(){})
  })
)
