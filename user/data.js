var pull = require('pull-stream')
var JSONH = require('json-human-buffer')

pull(
  phoenix.createFeedStream(),
  pull.drain(function(msg) {
    // add to doc
    var pre = document.createElement('pre')
    pre.textContent = JSONH.stringify(msg, null, 2).replace(/</g, '&lt;').replace(/>/, '&gt;')
    document.body.insertBefore(pre, document.body.firstChild)
  }, function() {
    // resize iframe
    var body = document.body,
    html = document.documentElement;
    var height = Math.max( body.scrollHeight, body.offsetHeight, 
                           html.clientHeight, html.scrollHeight, html.offsetHeight );
    phoenix.setIframeHeight(height + 'px', function(){})
  })
)
