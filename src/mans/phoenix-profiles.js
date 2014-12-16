{
  // metadata
  _: {
    name: "phoenix-profiles",
    version: "0.0.0",
  }

  // input streams
  in: 'sink',

  // output streams
  all: 'source',

  // getters
  get: 'async',

  // publishers
  updateSelf: 'async',
  giveNick: 'async'
}