const util = require('util')

module.exports = class Peer {
  constructor ({port, host, id, channel}) {
    this.remotePort = port
    this.remoteAddress = host
    this.id = id
    this.channel = channel
  }

  [util.inspect.custom] (depth, options) {
    if (this.id) return `Peer {id=${this.id}}`
    return `Peer {addr=${this.remoteAddress}:${this.remotePort}}`
  }
}
