'use strict'
var emojiNamedCharacters = require('emoji-named-characters')
var marked = require('marked');

var mentionRegex = /(\s|>|^)@([A-z0-9\/=\.\+]+)/g;

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  emoji: renderEmoji
});

exports.block = function(text, names, allowHtml) {
  return mentionLinks(marked(text||'', {sanitize: !allowHtml}), names)
}

var mentionRegex = /(\s|>|^)@([^\s^<]+)/g;
var mentionLinks =
exports.mentionLinks = function (str, names, spansOnly) {
  if (!names)
    return str
  return str.replace(mentionRegex, function(full, $1, $2) {
    var name = names[$2]
    if (!name)
      return ($1||'') + '<abbr class="text-danger" title="User not found">@'+$2+'</abbr>'
    if (spansOnly)
      return ($1||'') + '<strong class="user-link">@'+(name||$2)+'</strong>'
    return ($1||'') + '<a class="user-link" href="#/profile/'+$2+'">@' + name + '</a>'
  })
}

var emojiRegex = /(\s|>|^):([A-z0-9_]+):(\s|<|$)/g;
exports.emojis = function (str) {
  return str.replace(emojiRegex, function(full, $1, $2, $3) {
    return ($1||'') + renderEmoji($2) + ($3||'')
  })
}

function renderEmoji (emoji) {
  return emoji in emojiNamedCharacters ?
      '<img src="/img/emoji/' + encodeURI(emoji) + '.png"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji" align="absmiddle" height="20" width="20">'
    : ':' + emoji + ':'
}

