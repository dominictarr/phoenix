var mercury     = require('mercury')
var h           = require('mercury').h

var suggestBox = exports.suggestBox = function(box) {
  if (!box.active)
    return h('.suggest-box')
  return h('.suggest-box', { style: { left: (box.positionX+'px'), top: (box.positionY+'px') } }, [
    h('ul', box.filtered.map(function(opt, i) {
      var sel = 'li'
      if (i === box.selection)
        sel += '.selected'
      title = opt.image ? h('img', { src: opt.image }) : h('strong', opt.title)
      return h(sel, [title, ' ', h('small', opt.subtitle)])
    }))
  ])
}