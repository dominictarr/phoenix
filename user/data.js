var pull = require('pull-stream')
var JSONH = require('json-human-buffer')

document.body.innerHTML = [
  '<form role="form" onsubmit="javascript:runQuery(event)">',
    '<div class="form-group">',
      '<div class="input-group">',
        '<label class="sr-only" for="queryInput">Email address</label>',
        '<div class="input-group-addon">&fnof;</div>',
        '<input type="text" class="form-control" id="queryInput" placeholder="Enter query (eg `msg.content.type == \'post\'`)">',
      '</div>',
    '</div>',
  '</form>',
  '<p id="queryError" class="text-danger"></p>',
  '<p id="msgCount"></p>',
  '<div id="msgsDiv"></div>'
].join('')

// fetch feed data
var _msgs
pull(
  phoenix.createFeedStream(),
  pull.collect(function(err, msgs) {
    _msgs = msgs
    renderMessages(msgs)
  })
)

function renderMessages(msgs) {
  msgCount.textContent = msgs.length + ' messages'
  msgsDiv.innerHTML = ''
  msgs.forEach(function(msg) {
    // add to doc
    var pre = document.createElement('pre')
    pre.textContent = JSONH.stringify(msg, null, 2).replace(/</g, '&lt;').replace(/>/, '&gt;')
    msgsDiv.insertBefore(pre, msgsDiv.firstChild)
  })

  // resize iframe
  var body = document.body,
  html = document.documentElement;
  var height = Math.max( body.scrollHeight, body.offsetHeight, 
                         html.clientHeight, html.scrollHeight, html.offsetHeight );
  phoenix.setIframeHeight(height + 'px', function(){})
}

window.runQuery = function(e) {
  e.preventDefault()

  // get query code
  query = queryInput.value

  // execute query code
  try {
    queryError.textContent = ''
    var msgs = _msgs
    if (query) {
      var filter = new Function('msg', 'return '+query)
      msgs =_msgs.filter(filter)
    }
    renderMessages(msgs)
  } catch (e) {
    queryError.textContent = e.toString()
    console.error(e)
  }
}