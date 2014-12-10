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
        comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'action' })
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
      h('p.event-body', [comren.userlink(user.id, user.nickname, user, events), ' ', new widgets.Markdown(textValue, { inline: true, nicknames: nicknameMap })])
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
        h('strong', comren.jsa((isReply ? 're' : '') + 'action', events.setPublishFormType, { id: form.id, type: 'action' }))
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

function formError(form, events) {
  if (!form.error) return ''
  return h('.alert.alert-danger', [
    form.error,
    h('a.close', { 'ev-click': valueEvents.click(events.dismissPublishFormError, { id: form.id }), innerHTML: '&times;' })
  ])
}