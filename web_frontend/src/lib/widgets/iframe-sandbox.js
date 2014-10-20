var sandbox  = require('../sandbox')

module.exports = IframeSandbox
function IframeSandbox(html) {
  this.html = html
}
IframeSandbox.prototype.type = 'Widget';

IframeSandbox.prototype.init = function () {
  var iframe = sandbox.createIframe(this.html)
  this.update(null, iframe)
  return iframe
}

IframeSandbox.prototype.update = function (prev, elem) {
}