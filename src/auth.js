var querystr = require('querystring')

var permDescs = {
  identRead: { title: 'Verify your Identity', methods: ['whoami'] },
  feedRead: { title: 'Read Messages from the Feeds', methods: ['get', 'getPublicKey', 'createFeedStream', 'createHistoryStream', 'createLogStream', 'messagesByType', 'messagesLinkedToMessage', 'messagesLinkedToFeed', 'messagesLinkedFromFeed', 'feedsLinkedToFeed', 'feedsLinkedFromFeed', 'followedUsers', 'getLatest'] },
  feedPublish: { title: 'Publish Messages to your Feed', methods: ['add'] }
}

setup(querystr.parse(window.location.search.slice(1)))

function setup(opts) {
  if (!opts)
    return error('Query string is missing')
  if (!opts.domain)
    return error('?domain is missing')
  if (!opts.perms)
    return error('?perms[] is missing')
  opts.perms = Array.isArray(opts.perms) ? opts.perms : [opts.perms]

  // render app info
  var apptitle = ''
  if (opts.title) apptitle = '"'+makesafe(opts.title)+'" at '
  apptitle += '<a href="'+makesafe(opts.domain)+'" target="_blank">'+makesafe(opts.domain)+'</a>'
  render('.app-title', apptitle)

  // render perms
  var desc = getPermDesc(opts.perms)
  if (Object.keys(desc).length === 0)
    return error('No valid perms. Must be one of methods in\n'+JSON.stringify(permDescs, null, 2))
  var descHtml = []
  for (var k in desc) {
    descHtml.push(desc[k].title + ': <code>' + desc[k].methods.join(', ') + '</code>')
  }
  render('.app-perms', '<ul><li>'+descHtml.join('</li><li>')+'</li></ul>')
}

function getPermDesc(perms) {
  // search `permDescs` for any sections with matching methods
  var desc = {}
  perms.forEach(function(method) {
    for (var k in permDescs) {
      var permDesc = permDescs[k]
      if (permDesc.methods.indexOf(method) !== -1) {
        // match, start tracking the section and the methods which are requested
        if (!desc[k])
          desc[k] = { title: permDesc.title, methods: [] }
        desc[k].methods.push(method)
        return
      }
    }
    // no match found
    if (!desc.unknown)
      desc.unknown = { title: 'Use Extensions', methods: [] }
    desc.unknown.methods.push(method)
  })
  return desc
}

function error(explanation) {
  render('.alert-error', 'Bad auth request. Please contact the developer of the application you\'re attempting to use and let them know this occurred.')
  console.error(explanation)
}

function makesafe(str) {
  return (str||'').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function render(sel, html) {
  Array.prototype.forEach.call(document.querySelectorAll(sel), function(el) {
    if (el.style.display == 'none')
      el.style.display = 'block'
    el.innerHTML = html
  })
}