var path = require('path')
var fs   = require('fs')

module.exports = function(ssb, feed) {
  return function(cb) {
    var userspath = path.join(__dirname, '../..', 'user')
    fs.readdir(userspath, function(err, files) {
      cb(null, (files||[]).map(function(file) {
        return { name: file, url: '/user/'+file }
      }))
    })
  }
}