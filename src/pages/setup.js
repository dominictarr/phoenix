var h = require('hyperscript')
var pull = require('pull-stream')
var schemas = require('ssb-msg-schemas')
var com = require('../com')

module.exports = function (app) {

  // markup

  var input = h('input.form-control', { type: 'text', name: 'name', placeholder: 'Nickname', onkeyup: checkInput })
  var issue = h('span.text-danger')
  var postBtn = h('button.btn.btn-primary.pull-right', { disabled: true }, 'Save')
  app.setPage('setup', h('.row',
    h('.col-xs-6.col-xs-offset-3',
      h('br'), h('br'),
      h('h2', 'New account'),
      h('form.setup-form', { onsubmit: post },
        h('.panel.panel-default',
          h('.panel-body',
            h('.form-group',
              h('label.control-label', 'Welcome to Secure Scuttlebutt! What should your nickname be?'),
              input
            )
          )
        ),
        h('.form-group', issue, postBtn)
      )
    )
  ), { noHeader: true })

  // handlers

  function checkInput (e) {
    if (!input.value)
      valid = false
    else if(/ /.test(input.value)) {
      valid = false
      issue.textContent = 'Spaces are not allowed'
    } else
      valid = true

    if (valid) {
      postBtn.removeAttribute('disabled')
      issue.textContent = ''
    } else
      postBtn.setAttribute('disabled', true)
  }

  function post (e) {
    e.preventDefault()
    if (input.value) {
      schemas.addOwnName(app.ssb, input.value, function (err) {
        if (err) swal('Error While Publishing', err.message, 'error')
        else window.location = '#/'          
      })
    }
  }
}