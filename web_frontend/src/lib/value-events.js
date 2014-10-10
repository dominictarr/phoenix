var extend = require('xtend')
var BaseEvent = require('value-event/base-event')
var getFormData = require('form-data-set/element')

exports.click = require('value-event/click')

exports.ctrlEnter = BaseEvent(function (e) {
  if (e.keyCode != 13 || !e.ctrlKey)
    return
  
  var value = getFormData(e.currentTarget)
  var data = extend(value, this.data)
  
  if (e.preventDefault)
    e.preventDefault()

  return data;
})

exports.submit = BaseEvent(function (e) {
  var target = e.target
  var isValid =
    (e.type == 'click' && target.tagName == 'BUTTON') ||
    (e.type == 'click' && target.type == 'submit') ||
    ((target.tagName == 'TEXTAREA' || target.type == 'text') && (e.type == 'keydown' && e.keyCode == 13 && e.ctrlKey))
    
  if (!isValid) {
    if (e.startPropagation)
      e.startPropagation()
    return
  }

  var value = getFormData(e.currentTarget)
  var data = extend(value, this.data)

  if (e.preventDefault)
    e.preventDefault()

  return data;
})
