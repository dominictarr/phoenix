{
  name: "phoenix-network",
  version: "0.0.0",
  methods: {
    // input streams
    in: 'sink',

    // output streams
    followers: 'source',
    following: 'source',
    pubPeers: 'source',

    // getters
    isFollowing: 'async',

    // publishers
    follow: 'async',
    unfollow: 'async',
    announcePub: 'async'
  }
}