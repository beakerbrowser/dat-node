const EventEmitter = require('events')

const DatNodeStorage = require('./dat-node-storage')
const DatNodeSwarm = require('./dat-node-swarm')
const DatNodeDNS = require('./dat-node-dns')
const DatNodePeers = require('./dat-node-peers')

const DatArchive = require('./dat-archive')

const hyperdrive = require('./data-structures/hyperdrive')
const {toKey} = require('./util')

exports.createNode = function (opts) {
  return new DatNode(opts)
}

class DatNode extends EventEmitter {
  constructor (opts = {}) {
    super()

    this.storage = new DatNodeStorage(opts)
    this.swarm = new DatNodeSwarm(this, opts)
    this.dns = new DatNodeDNS(this.storage, opts)
    this.peers = new DatNodePeers()

    this.autoSwarm = opts.autoSwarm !== false

    this._dats = {}
    this._datsByDKey = {}
    // ^ both of these fields are populated by the data-structures/*.js loaders
    this._datPeers = {}
  }

  listen (port) {
    this.swarm._listen(port)
  }

  async close () {
    for (let datInfo of Object.values(this._dats)) {
      await this.swarm.leave(datInfo.key)
      await closeDat(datInfo.dataStructure)
    }
    this.swarm._close()
  }

  createDebugLogStream () {
    // TODO
  }

  async getArchive (url) {
    var key = toKey(url)
    var datInfo = this._dats[key]

    if (!datInfo) {
      datInfo = await hyperdrive.load(this, key)
    }

    await datInfo.loadPromise
    return new DatArchive(datInfo, this)
  }

  async createArchive (opts = {}) {
    var datInfo = await hyperdrive.create(this, opts)
    return new DatArchive(datInfo, this)
  }

  async forkArchive (url, opts = {}) {
    var datInfo = await hyperdrive.fork(this, toKey(url), opts)
    return new DatArchive(datInfo, this)
  }

  async getPeers (url) {
    if (this._datPeers[url])
      return this._datPeers[url]

    const archive = await this.getArchive(url)

    const DatPeers = this.peers.DatPeers

    const datPeers = new DatPeers(archive)

    this._datPeers[url] = datPeers

    return datPeers
  }

  getMtime (url) {
    return this.storage.getMtime(url)
  }

  getDiskUsage (url) {
    return this.storage.getDiskUsage(url)
  }

  getSyncProgress (url) {
    return 0
    /*
    TODO need the code that computes latestStats
    var dat = this._dats[toKey(url)]
    if (!dat || dat.latestStats.numBlocks === 0) {
      return 0
    }
    if (dat.latestStats.numDownloadedBlocks === dat.latestStats.numBlocks) {
      return 1
    }
    return Math.min(dat.latestStats.numDownloadedBlocks / dat.latestStats.numBlocks, 1)
    */
  }

  isFullySynced (url) {
    return this.getSyncProgress(url) === 1
  }
}

function closeDat (dataStructure) {
  return new Promise((resolve, reject) => {
    dataStructure.close(err => {
      if (err) reject(err)
      else resolve()
    })
  })
}
