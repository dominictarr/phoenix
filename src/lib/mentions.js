var schemas = require('ssb-msg-schemas')
var mlib = require('ssb-msgs')

var mentionRegex = /(\s|>|^)@([^\s^<]+)/g;
var replace =
exports.replace = function (str, each, spansOnly) {
  return str.replace(mentionRegex, function(full, $1, name) {
    // give cb functions for found/notfound
    return each(name, 
      function (id, name) {
        if (spansOnly)
          return ($1||'') + '<strong class="user-link">@'+(name||id)+'</strong>'
        return ($1||'') + '<a class="user-link" href="#/profile/'+id+'">@' + name + '</a>'
      },
      function () {
        return ($1||'') + '<abbr class="text-danger" title="User not found">@'+name+'</abbr>'
      }
    )
  })
}

var mentionOpts = { tofeed: true, rel: 'mentions' }
exports.post = function (str, app, msg, spansOnly) {
  var mentions = mlib.getLinks(msg.value.content, mentionOpts)
  return replace(str, function (name, found, notfound) {
    // find the id from the mention links
    var id
    if (schemas.isHash(name))
      id = name
    else {
      for (var i = 0; i < mentions.length; i++) {
        if (mentions[i].name === name) {
          id = mentions[i].feed
          break
        }
      }
    }

    // render
    if (!id)
      return notfound()
    name = app.names[id] || name // try to use locally-assigned name
    return found(id, name)
  }, spansOnly)
}

exports.preview = function (str, nameList) {
  return replace(str, function (name, found, notfound) {
    if (schemas.isHash(name))
      return found(name, name)
    if (name in nameList)
      return found(name, name)
    return notfound()
  }, true)
}