var pull = require('pull-stream')

module.exports = {
  name: 'phoenix-feed',
  version: '0.0.0',
  permissions: {
    // anonymous: {allow: ['has', 'get']}, :TODO:
  },
  init: function (sbot) {
    return {
      // :TODO:
      /*get: function (hash) {
        return pull(blobs.get(hash), toBase64())
      }*/
    }
  }
}
