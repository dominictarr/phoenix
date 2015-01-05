var emojiNamedCharacters = require('emoji-named-characters')
var marked = require('marked');

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

exports.inline = function(text, names) {
  return mentionLinks(marked(text||'', {renderer: inlineRenderer}), names)
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

// Inline-only renderer
function InlineRenderer(options) {
  this.options = options || {};
}

InlineRenderer.prototype.code = function(code, lang, escaped) {
  return '<code>'
      + (escaped ? code : escape(code, true))
      + '</code>';
};

InlineRenderer.prototype.blockquote = function(quote) {
  return quote;
};

InlineRenderer.prototype.html = function(html) {
  return html;
};

InlineRenderer.prototype.heading = function(text, level, raw) {
  return '<strong>' + text + '</strong> ';
};

InlineRenderer.prototype.hr = function() {
  return ' ';
};

InlineRenderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + ' class="list-inline">\n' + body + '</' + type + '>\n';
};

InlineRenderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

InlineRenderer.prototype.paragraph = function(text) {
  return text + ' ';
};

InlineRenderer.prototype.table = function(header, body) {
  return '';
};

InlineRenderer.prototype.tablerow = function(content) {
  return '';
};

InlineRenderer.prototype.tablecell = function(content, flags) {
  return ''
};

// span level renderer
InlineRenderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

InlineRenderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

InlineRenderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

InlineRenderer.prototype.br = function() {
  return ' '
};

InlineRenderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

InlineRenderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

InlineRenderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};