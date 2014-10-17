var sandbox  = require('../sandbox')

module.exports = IframeSandbox
function IframeSandbox(opts) {
  this.opts = opts
}
IframeSandbox.prototype.type = 'Widget';

IframeSandbox.prototype.init = function () {
  var iframe = sandbox.createIframe(this.opts)
  this.update(null, iframe)
  return iframe
}

IframeSandbox.prototype.update = function (prev, elem) {
}