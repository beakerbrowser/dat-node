const datEncoding = require('dat-encoding')
const util = require('util')

module.exports = class Connection {
  constructor({remoteAddress, remotePort, key, discoveryKey, peerInfo}) {
    if (peerInfo) {
      this.remoteAddress = peerInfo.host
      this.remotePort = peerInfo.port
    } else {
      this.remoteAddress = remoteAddress
      this.remotePort = remotePort
    }
    this.key = key && datEncoding.toStr(key)
    this.discoveryKey = discoveryKey && datEncoding.toStr(discoveryKey)
  }

  [util.inspect.custom](depth, options) {
    return `Connection {${this.remoteAddress}:${this.remotePort} key=${this.key}}`
  }
}