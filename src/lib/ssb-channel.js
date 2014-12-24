var pull = require('pull-stream')
var ws   = require('pull-ws-server')
var EventEmitter = require('events').EventEmitter

var DEFAULT_PROTOCOL = 'http:'
var DEFAULT_PORT = 2000

function address(addr) {
  addr = addr || {}
  if (typeof addr == 'string'){
    var parts = addr.split(':')
    if (parts.length === 3)
      addr = { protocol: parts[0]+':', host: parts[1].slice(2), port: parts[2]}
    else if (parts .length === 2)
      addr = { host: parts[0], port: parts[1] }
    else
      addr = { host: parts[0] }
  }
  if (!addr.protocol) addr.protocol = DEFAULT_PROTOCOL
  if (!addr.host) throw new Error('BadParam - no host:String or {.host:String}')
  if (!addr.port || +addr.port != addr.port) addr.port = DEFAULT_PORT
  addr.domain = addr.protocol+'//'+addr.host+':'+addr.port
  return addr
}

exports.connect = function (rpcapi, addr, cb) {
  var chan = new EventEmitter()

  chan.connect = function(addr, cb) {
    addr = address(addr)
    if (chan.wsStream)
      chan.emit('reconnecting')

    chan.addr = addr
    chan.wsStream = ws.connect(addr)
    chan.rpcStream = rpcapi.createStream()
    pull(chan.wsStream, chan.rpcStream, chan.wsStream)

    chan.wsStream.socket.onopen = function() {
      chan.emit('connect')
      cb && cb()
    }

    chan.wsStream.socket.onclose = function() {
      chan.rpcStream.close(function(){})
      chan.emit('error', new Error('Close'))
    }
  }

  chan.reconnect = function(cb) {
    this.connect(this.addr, cb)
  }  

  chan.close = function(cb) {
    this.rpcStream.close(cb || function(){})
    this.wsStream.socket.close()
  }

  chan.reset = function(opts) {
    opts = opts || {}
    opts.wait = (typeof opts.wait == 'undefined') ? 10*1000 : opts.wait
    chan.close(function() {
      setTimeout(chan.connect.bind(chan, chan.addr), opts.wait)
    })
  }

  chan.connect(addr, cb)
  return chan
}