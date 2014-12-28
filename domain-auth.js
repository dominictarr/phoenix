var getRawBody = require('raw-body')

module.exports = function(server) {
  var authedApps = {}

  return function(req, res, next) {
    // CORS
    var originIsSelf = (!req.headers.origin || req.headers.origin == ('http://localhost:' + server.config.port))
    res.setHeader('Access-Control-Allow-Origin', (req.headers.origin in authedApps) ? req.headers.origin : ('http://localhost:' + server.config.port))
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, DELETE')
    if (req.method == 'OPTIONS')
      return res.writeHead(204), res.end()

    // Access token
    if (req.url == '/access.json') {
      // generate access secret according to host and assigned perms
      var accessSecret
      if (!originIsSelf) {
        if (req.headers.origin in authedApps)
          accessSecret = server.createAccessKey({ allow: authedApps[req.headers.origin].allow })
        else {
          res.writeHead(403)
          return res.end()
        }
      } else
        accessSecret = server.createAccessKey({ allow: null }) // allow all

      // respond with token
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      var accessToken = server.options.signObjHmac(accessSecret, {
        role: 'client',
        ts: Date.now(),
        keyId: server.options.hash(accessSecret)
      })
      return res.end(JSON.stringify(accessToken))
    }

    // Auth grant
    if (req.url.indexOf('/auth.html') === 0 && req.method == 'POST' && originIsSelf) {
      return getJsonBody(req, res, function(err, body) {
        if (!body.domain || typeof body.domain != 'string' || !body.allow || !Array.isArray(body.allow)) {
          res.writeHead(422, 'bad entity - invalid request object')
          return res.end()
        }
        // add entry
        authedApps[body.domain] = {
          domain: body.domain,
          title: body.title || body.domain,
          allow: body.allow
        }
        res.writeHead(204)
        res.end()
      })
    }

    // Auth ungrant
    if (req.url.indexOf('/auth.html') === 0 && req.method == 'DELETE' && !originIsSelf) {
      // remove entry
      if (req.headers.origin in authedApps) {
        delete authedApps[req.headers.origin]
      }
      res.writeHead(204)
      return res.end()
    }

    next()
  }
}


function getJsonBody(req, res, cb) {
  getRawBody(req, { length: req.headers['content-length'], limit: '1mb', encoding: 'utf-8' }, function(err, body) {
    if (err) {
      res.writeHead(500, err.toString())
      return res.end()
    }
    try { body = JSON.parse(body) }
    catch (e) {
      res.writeHead(422, 'bad entity - failed to parse json')
      return res.end()
    }
    cb(null, body)
  })
}