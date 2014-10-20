
// attribute hook 
var CounterTrigger = exports.CounterTrigger = function (value, counter) {
  this.value = value
  this.counter = counter
}
CounterTrigger.prototype.hook = function (elem, prop, previous) {
  if (!previous || this.counter !== previous.counter) {
    if (prop == 'value')
      elem.value = this.value // setting .value directly is more reliable
    else
      elem.setAttribute(prop, this.value)
  }
}