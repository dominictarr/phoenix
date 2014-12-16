{
  // input streams
  in: 'sink',

  // output streams
  all: 'source',
  inbox: 'source',
  user: 'source',

  // getters
  get: 'async',
  getReplies: 'async',

  // publishers
  postText: 'async',
  postReply: 'async',
  postAction: 'async',
  postReaction: 'async',
  rebroadcast: 'async'
}