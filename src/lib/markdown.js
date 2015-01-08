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

var mentionRegex = /(\s|>|^)@([A-z0-9\/=\.\+]+)/g;
var mentionLinks =
exports.mentionLinks = function (str, names) {
  if (!names)
    return str
  return str.replace(mentionRegex, function(full, $1, $2) {
    var nickname = names[$2] || $2;
    return ($1||'') + '<a class="user-link" href="#/profile/'+$2+'">@' + nickname + '</a>'
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

