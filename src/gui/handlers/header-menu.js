

exports.toggle = function(state, el, e) {
  var headerMenu = document.getElementById('header-menu')
  headerMenu.classList.toggle('open')
}

exports.setRenderMode = function(state, el, e) {
  state.page.renderMode = el.dataset.mode
  state.sync()
}