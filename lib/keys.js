var fs       = require('fs')
var proquint = require('proquint-')
var ecc      = require('eccjs')
var k256     = ecc.curves.k256

exports.load = function(namefile) {
  try {
    var privateKey = proquint.decode(fs.readFileSync(namefile, 'ascii').replace(/\s*\#[^\n]*/g, ''))
    return ecc.restore(k256, privateKey)
  } catch (e) {
    return null
  }
}