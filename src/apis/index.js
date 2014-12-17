module.exports = function(ssb) {
  return {
    feed: require('./phoenix-feed').init(ssb),
    profiles: require('./phoenix-profiles').init(ssb),
    network: require('./phoenix-network').init(ssb)
  }
}