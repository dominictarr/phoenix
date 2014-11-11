var mercury     = require('mercury')
var h           = require('mercury').h
var valueEvents = require('../value-events')
var widgets     = require('../widgets')
var hooks       = require('../hooks')
var comren      = require('../common-render')
var helptip     = require('./helptip').helptip

var publishForm = exports.publishForm = function(form, events, user, nicknameMap) {
  if (form.type == 'text') return publishFormText(form, events, user, nicknameMap)
  if (form.type == 'action')  return publishFormAction(form, events, user, nicknameMap)
  if (form.type == 'gui')  return publishFormGui(form, events, user, nicknameMap)
}

function publishFormText(form, events, user, nicknameMap) {
  var isReply = !!form.parent
  var previewDisplay = (!!form.textValue) ? 'block' : 'none'
  return  h('.publish-wrapper', [
    formError(form, events),
    h('.panel.panel-default', { style: { display: previewDisplay } }, [
      h('.panel-body', h('.publish-preview', new widgets.Markdown(form.textValue, { nicknames: nicknameMap })))
    ]),
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      h('p', h('textarea.form-control', {
        name: 'publishText',
        placeholder: 'Publish...',
        rows: 3,
        value: form.textValue,
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keydown': [valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id }), events.mentionBoxKeypress],
        'ev-input': events.mentionBoxInput,
        'ev-blur': events.mentionBoxBlur
      })),
      h('span.pull-right', [
        helptip(['Posts are formatted with GitHub-flavored Markdown. You can mention somebody with an @ symbol, and insert ', comren.a('http://www.emoji-cheat-sheet.com/', 'emojis'), ' with a : symbol.']),
        ' ',
        h('strong', comren.jsa('text', events.setPublishFormType, { id: form.id, type: 'text' })),
        ' / ',
        comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'action' }),
        // ' / ', :TODO: gui posts are disabled for now
        // comren.jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' })
      ]),
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? comren.jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])
}

function publishFormAction(form, events, user, nicknameMap) {
  var isReply = !!form.parent
  var previewDisplay = (!!form.textValue) ? 'block' : 'none'
  var suggestions = (isReply) ? h('p', [
    h('span.btn-group', [suggestBtn('Like', 'liked'), suggestBtn('Dislike', 'disliked')]),
    ' ', h('span.btn-group', [suggestBtn('Love', 'loved'), suggestBtn('Hate', 'hated')]),
    ' ', h('span.btn-group', [suggestBtn('Agree', 'agreed with'), suggestBtn('Disagree', 'disagreed with')]),
    ' ', h('span.btn-group', [suggestBtn('Confirm', 'confirmed'), suggestBtn('Deny', 'denied')])
  ]) : ''
  var textValue = (isReply) ? (form.textValue + ' this.') : form.textValue

  var helptext
  if (isReply) {
    helptext = 'Reactions are a free-form "like" button. They are aggregated underneath the post you\'re reacting to.'
  } else {
    helptext = 'Actions are a way to say what you\'re doing or thinking without making a conversation out of it. They go on the right of the feed.'
  }

  return h('.publish-wrapper', [
    formError(form, events),
    h('.phoenix-event', { style: { display: previewDisplay } }, [
      h('p.event-body', [comren.userlink(user.id, user.nickname), ' ', new widgets.Markdown(textValue, { inline: true, nicknames: nicknameMap })])
    ]),      
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      suggestions,
      h('p', h('input.form-control', {
        name: 'publishText',
        value: form.textValue,
        placeholder: 'Publish...',
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id }),
        'ev-keyup': [
          events.mentionBoxKeypress,
          valueEvents.ctrlEnter(events.submitPublishForm, { id: form.id })
        ],
        'ev-input': events.mentionBoxInput,
        'ev-blur': events.mentionBoxBlur
      })),
      h('span.pull-right', [
        comren.jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
        ' / ',
        helptip(helptext),
        ' ',
        h('strong', comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'action' })),
        // ' / ', :TODO: gui posts are disabled for now
        // comren.jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' })
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

var replyerSampleCode = '<h1>Reply Generator</h1>\nPost:\n<button onclick="text()">Text</button>\n<button onclick="reaction()">Reaction</button>\n<button onclick="gui()">GUI</button>\n<script>\nvar log = console.log.bind(console)\nfunction text() { guipost.addReply(\'text\', \'A text reply\', log) }\nfunction reaction() { guipost.addReply(\'action\', \'reacted\', log) }\nfunction gui() { guipost.addReply(\'gui\', \'<h1>A Guiply</h1>\', log) }\n</script>'
var injectorSampleCode = '<h1>Reply to me!</h1>\n<p>Any replies will be injected into the original post.</p>\n<script>\nguipost.getReplies(function(err, replies) {\n  replies.forEach(function(reply) {\n    inject(reply.content.text)\n  })\n})\n</script>'
var canvasSampleCode = '<canvas id="canvas" width="150" height="100"></canvas>\n<script>\n  var ctx = canvas.getContext("2d");\n\n  ctx.fillStyle = "rgb(200,0,0)";\n  ctx.fillRect (10, 10, 55, 50);\n\n  ctx.fillStyle = "rgba(0, 0, 200, 0.5)";\n  ctx.fillRect (30, 30, 55, 50);\n</script>'

function publishFormGui(form, events, user, nicknameMap) {
  var previewDisplay = (!!form.textValue) ? 'block' : 'none'
  var preview
  if (!form.isRunning) {
    preview = h('.gui-post-wrapper', [
      h('.gui-post-runbtn', {'ev-click': valueEvents.click(events.testPublishFormCode, { id: form.id, run: true })}),
      h('pre.gui-post', h('code', form.textValue))
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
    formError(form, events),
    h('.panel.panel-default', { style: { display: previewDisplay } }, [
      h('.panel-body', h('.publish-preview', preview))
    ]),
    h('div.publish-form', { 'ev-event': valueEvents.submit(events.submitPublishForm, { id: form.id }) }, [
      h('p', [
        'Snippet: ',
        comren.jsa('replyer', events.setPublishFormText, { id: form.id, publishText: replyerSampleCode }),
        ' ',
        comren.jsa('injector', events.setPublishFormText, { id: form.id, publishText: injectorSampleCode }),
        ' ',
        comren.jsa('canvas', events.setPublishFormText, { id: form.id, publishText: canvasSampleCode })
      ]),
      h('p', h('textarea.form-control', {
        name: 'publishText',
        placeholder: 'Publish...',
        rows: 10,
        value: form.textValue,
        'ev-change': mercury.valueEvent(events.setPublishFormText, { id: form.id })
      })),
      h('span.pull-right', [
        comren.jsa('text', events.setPublishFormType, { id: form.id, type: 'text' }),
        ' / ',
        comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'action' }),
        ' / ',
        helptip(['GUIs are interactive HTML applets, tightly sandboxed for safety. You can write HTML, CSS, and Javascript, then share it on your feed.']),
        ' ',
        h('strong', comren.jsa('gui', events.setPublishFormType, { id: form.id, type: 'gui' }))
      ]),
      ' ',
      h('button.btn.btn-default', 'Post'),
      ' ',
      (!form.permanent) ? comren.jsa(['cancel'], events.cancelPublishForm, { id: form.id }, { className: 'cancel' }) : ''
    ])
  ])
}

function formError(form, events) {
  if (!form.error) return ''
  return h('.alert.alert-danger', [
    form.error,
    h('a.close', { 'ev-click': valueEvents.click(events.dismissPublishFormError, { id: form.id }), innerHTML: '&times;' })
  ])
}