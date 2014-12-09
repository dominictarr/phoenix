var sandbox  = require('../sandbox')

module.exports = IframeSandbox
function IframeSandbox(html, mid, replies, onReply) {
  this.html = html
  this.mid = mid
  this.replies = replies
  this.onReply = onReply
}
IframeSandbox.prototype.type = 'Widget';

IframeSandbox.prototype.init = function () {
  var div = document.createElement('div')
  div.innerHTML = 'temporarily disabled'
  return div

  // :TODO: decide what should be done here
  var iframe = sandbox.createIframe(this.html, this.mid, this.replies, this.onReply)
  this.update(null, iframe)
  return iframe
}

IframeSandbox.prototype.update = function (prev, elem) {
  if (this.replies)
    elem.replies = this.replies
}