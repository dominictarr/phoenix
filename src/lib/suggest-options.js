// options for the suggest box
module.exports = {
  ':': []
}
// add emojis by default
for (var emoji in require('emoji-named-characters')) {
  module.exports[':'].push({
    image: '/img/emoji/' + emoji + '.png',
    title: emoji,
    subtitle: emoji,
    value: emoji + ':'
  })
}