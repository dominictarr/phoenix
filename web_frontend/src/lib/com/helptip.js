var mercury = require('mercury')
var h = require('mercury').h

var helptip = exports.helptip = function(text) {
  return [
    h('a', { href: 'javascript:void()', 'ev-click': toggleTip }, h('span.glyphicon.glyphicon-question-sign')),
    h('.helptip', text)
  ]
}

function toggleTip(e) {
  e.preventDefault()

  // activate the helptip next to this one
  var target = e.target
  if (target.tagName == 'SPAN')
    target = target.parentNode
  target.nextSibling.classList.toggle('active')
}

// close help tips on clicks
var delegator = mercury.Delegator()
delegator.addGlobalEventListener('click', function (ev) {
  Array.prototype.forEach.call(document.querySelectorAll('.helptip.active'), function(el) {
    el.classList.remove('active')
  })
})