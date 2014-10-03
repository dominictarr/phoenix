var util  = require('../../../lib/util')
var mdlib = require('markdown').markdown

exports.Markdown = Markdown
function Markdown(rawtext) {
  this.rawtext = rawtext
}
Markdown.prototype.type = 'Widget';

Markdown.prototype.init = function () {
  var elem = document.createElement('div')
  this.update(null, elem)
  return elem
}

Markdown.prototype.update = function (prev, elem) {
  elem.innerHTML = mdlib.toHTML(util.escapePlain(this.rawtext))
}