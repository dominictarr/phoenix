var util  = require('../../../lib/util')
var marked = require('marked');
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
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

exports.DropdownBtn = DropdownBtn
function DropdownBtn(title) {
  this.title = title||''
}
DropdownBtn.prototype.type = 'Widget';

DropdownBtn.prototype.init = function () {
  var elem = document.createElement('button')
  elem.className = 'btn btn-default dropdown-toggle'
  this.update(null, elem)
  return elem
}

DropdownBtn.prototype.update = function (prev, elem) {
  elem.innerHTML = this.title + ' <span class="caret"></span>'
  elem.onclick = onclick.bind(elem)
  elem.onsubmit = abort
}

function onclick(e) {
  abort(e)
  this.parentNode.classList.toggle('open')
}

function abort(e) {
  e.preventDefault()
  e.stopPropagation()
}