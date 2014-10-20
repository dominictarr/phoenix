var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('../value-events')
var widgets     = require('../widgets')
var hooks       = require('../hooks')
var comren      = require('../common-render')

var publishForm = exports.publishForm = function(form, events, user, nicknameMap) {
  if (form.type == 'text') return publishFormText(form, events, user, nicknameMap)
  if (form.type == 'act')  return publishFormAction(form, events, user, nicknameMap)
  if (form.type == 'gui')  return publishFormGui(form, events, user, nicknameMap)
}

function publishFormText(form, events, user, nicknameMap) {
  var isReply = !!form.parent
  var previewDisplay = (!!form.preview) ? 'block' : 'none'
  return  h('.publish-wrapper', [
    h('.panel.panel-default', { style: { display: previewDisplay } }, [
      h('.panel-body', h('.publish-preview', new widgets.Markdown(form.preview, { nicknames: nicknameMap })))
    ]),
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      h('p', h('textarea.form-control', {
        name: 'publishText',
        placeholder: form.textPlaceholder,
        rows: form.textRows || 1,
        value: form.textValue,
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': mercury.valueEvent(events.updatePublishFormText, { id: form.id }),
        'ev-keydown': [valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id }), events.mentionBoxKeypress],
        'ev-input': events.mentionBoxInput,
        'ev-blur': events.mentionBoxBlur
      })),
      h('span.pull-right', [
        h('strong', comren.jsa('text', events.setPublishFormType, { id: form.id, type: 'text' })),
        ' / ',
        comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'act' }),
        ' / ',
        comren.jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' })
      ]),
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? comren.jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])
}

function publishFormAction(form, events, user, nicknameMap) {
  var isReply = !!form.parent
  var previewDisplay = (!!form.preview) ? 'block' : 'none'
  var hand = (isReply) ? 'up' : 'right'
  var suggestions = (isReply) ? h('p', [
    h('span.btn-group', [suggestBtn('Like', 'liked'), suggestBtn('Dislike', 'disliked')]),
    ' ', h('span.btn-group', [suggestBtn('Love', 'loved'), suggestBtn('Hate', 'hated')]),
    ' ', h('span.btn-group', [suggestBtn('Agree', 'agreed with'), suggestBtn('Disagree', 'disagreed with')]),
    ' ', h('span.btn-group', [suggestBtn('Confirm', 'confirmed'), suggestBtn('Deny', 'denied')])
  ]) : ''
  var preview = (isReply) ? (form.preview + ' this.') : form.preview

  return h('.publish-wrapper', [
    h('.phoenix-event', { style: { display: previewDisplay } }, [
      h('span.event-icon.glyphicon.glyphicon-hand-'+hand),
      h('p.event-body', [comren.userlink(user.id, user.nickname), ' ', new widgets.Markdown(preview, { inline: true, nicknames: nicknameMap })])
    ]),      
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      suggestions,
      h('p', h('input.form-control', {
        name: 'publishText',
        // placeholder: form.textPlaceholder,
        value: new hooks.CounterTrigger(form.textValue||'', form.setValueTrigger),
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': [
          events.mentionBoxKeypress,
          mercury.valueEvent(events.updatePublishFormText, { id: form.id }), 
          valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id })
        ],
        'ev-input': events.mentionBoxInput,
        'ev-blur': events.mentionBoxBlur
      })),
      h('span.pull-right', [
        comren.jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
        ' / ',
        h('strong', comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'act' })),
        ' / ',
        comren.jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' })
      ]),
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? comren.jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])

  function suggestBtn(label, text) {
    return comren.jsa(label, events.setPublishFormText, { id: form.id, publishText: text }, { className: 'btn btn-default btn-xs' })
  }
}

var canvasSampleCode = '<canvas id="canvas" width="150" height="100"></canvas>\n<script>\n  var ctx = canvas.getContext("2d");\n\n  ctx.fillStyle = "rgb(200,0,0)";\n  ctx.fillRect (10, 10, 55, 50);\n\n  ctx.fillStyle = "rgba(0, 0, 200, 0.5)";\n  ctx.fillRect (30, 30, 55, 50);\n</script>'

function publishFormGui(form, events, user, nicknameMap) {
  var previewDisplay = (!!form.preview) ? 'block' : 'none'
  var preview
  if (!form.isRunning) {
    preview = h('.gui-post-wrapper', [
      h('.gui-post-runbtn', {'ev-click': valueEvents.click(events.testPublishFormCode, { id: form.id, run: true })}),
      h('pre.gui-post', h('code', form.preview))
    ])
  } else {
    preview =  h('.gui-post-wrapper.gui-running', [
      h('span.pull-right', [
        comren.jsa(comren.icon('refresh'), events.testPublishFormCode, { id: form.id, restart: true }, { className: 'text-muted' }),
        ' ',
        comren.jsa(comren.icon('remove'), events.testPublishFormCode, { id: form.id, run: false }, { className: 'text-danger' })
      ]),
      new widgets.IframeSandbox(form.textValue)
    ])
  }

  var isReply = !!form.parent
  return  h('.publish-wrapper', [
    h('.panel.panel-default', { style: { display: previewDisplay } }, [
      h('.panel-body', h('.publish-preview', preview))
    ]),
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      h('p', ['Snippet: ', comren.jsa('canvas', events.setPublishFormText, { id: form.id, publishText: canvasSampleCode })]),
      h('p', h('textarea.form-control', {
        name: 'publishText',
        rows: (!!form.preview) ? 10 : 1,
        value: form.textValue,
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': mercury.valueEvent(events.updatePublishFormText, { id: form.id })
      })),
      h('span.pull-right', [
        comren.jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
        ' / ',
        comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'act' }),
        ' / ',
        h('strong', comren.jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' }))
      ]),
      ' ',
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? comren.jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])
}