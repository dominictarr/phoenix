// rpc api served by the frame
exports.iframe = {
  async: [],
  source: []
}

// rpc api served by the container page
exports.container = {
  async: [
    // core ssb
    'add',
    'get',
    'getPublicKey',
    'whoami',

    // user-pages
    'setIframeHeight'
  ],

  source: [
    // core ssb
    'createFeedStream',
    'createHistoryStream',
    'createLogStream',
    'messagesByType',
    'messagesLinkedToMessage',
    'messagesLinkedToFeed',
    'messagesLinkedFromFeed',
    'feedsLinkedToFeed',
    'feedsLinkedFromFeed'
  ]
}