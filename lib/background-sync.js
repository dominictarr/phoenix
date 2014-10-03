module.exports = function(backend, syncInterval) {
  setInterval(function() {
    backend.syncNetwork({ ifOlderThan: Math.round(syncInterval * 2/3) }, function(err, res) {
      if (err) console.error('Failed background sync', err)
      else {
        for (var host in res) {
          if (res[host].error)
            console.error(host, 'error', res[host].msg)
          else
            console.log(host, 'synced in', res[host].elapsed, 'ms')
        }
      }
    })
  }, syncInterval)
}