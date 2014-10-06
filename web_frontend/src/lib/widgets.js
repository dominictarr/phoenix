var util  = require('../../../lib/util')
var marked = require('marked');
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

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
  elem.innerHTML = marked(util.escapePlain(this.rawtext))
}