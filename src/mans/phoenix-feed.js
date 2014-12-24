module.exports = {
  // config
  addInboxIndex: 'async',
  delInboxIndex: 'async',

  // input streams
  in: 'sink',

  // output streams
  all: 'source',
  inbox: 'source',

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