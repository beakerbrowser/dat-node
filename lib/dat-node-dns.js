const createDatDNS = require('dat-dns')
const {InvalidDomainName} = require('beaker-error-constants')
const {DAT_HASH_REGEX} = require('./const')

class DatNodeDNS {
  constructor (storage, opts) {
    this._storage = storage
    this._resolver = createDatDNS({
      persistentCache: {
        read: this.readPersistentCache.bind(this),
        write: this.writePersistentCache.bind(this)
      }
    })
  }

  resolve (url) {
    return this._resolver.resolveName(url).catch(_ => { throw new InvalidDomainName() })
  }

  async readPersistentCache (name, err) {
    var key = await this._storage.getDNSCache(name)
    if (!key) throw err
    return key
  }

  async writePersistentCache (name, key) {
    if (DAT_HASH_REGEX.test(name)) return // dont write for raw urls
    await this._storage.setDNSCache(name, key)
  }
}

module.exports = DatNodeDNS
