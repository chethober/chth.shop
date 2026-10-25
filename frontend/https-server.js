// Starts the standalone Next.js server, over HTTPS when a certificate is mounted at
// TLS_CERT_FILE / TLS_KEY_FILE (e.g. one made with mkcert for https://localhost); plain HTTP otherwise.
const fs = require('fs')
const http = require('http')
const https = require('https')

const { TLS_CERT_FILE, TLS_KEY_FILE } = process.env

if (TLS_CERT_FILE && TLS_KEY_FILE && fs.existsSync(TLS_CERT_FILE) && fs.existsSync(TLS_KEY_FILE)) {
  const tls = { cert: fs.readFileSync(TLS_CERT_FILE), key: fs.readFileSync(TLS_KEY_FILE) }
  // Next's standalone server always calls http.createServer; hand it an HTTPS server instead.
  http.createServer = (...args) => https.createServer(tls, ...args)
  console.log(`Serving HTTPS with ${TLS_CERT_FILE}`)
}

require('./server.js')
