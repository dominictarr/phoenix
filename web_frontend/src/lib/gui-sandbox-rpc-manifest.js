// rpc api served by the frame
exports.iframe = {
  async: ['inject'],
  source: []
}

// rpc api served by the container page
exports.container = {
  async: ['ready', 'addReply', 'getReplies']
}