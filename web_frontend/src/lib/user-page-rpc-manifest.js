// rpc api served by the frame
exports.iframe = {
}

// rpc api served by the container page
exports.container = {
  // ssb/scuttlebot apis
  add: 'async',
  get: 'async',
  getPublicKey: 'async',
  whoami: 'async',
  createFeedStream: 'source',
  createHistoryStream: 'source',
  createLogStream: 'source',
  messagesByType: 'source',
  messagesLinkedToMessage: 'source',
  messagesLinkedToFeed: 'source',
  messagesLinkedFromFeed: 'source',
  feedsLinkedToFeed: 'source',
  feedsLinkedFromFeed: 'source',
  
  // user-page apis
  setIframeHeight: 'async'
}