module.exports = function(ssb, feed) {
  return function() {
    return feed.createReplicationStream({ rel: 'follows' }, function(){})
  }
}