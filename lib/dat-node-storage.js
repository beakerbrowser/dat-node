/**

DatNodeStorage

Manager for stored Dats, metadata, and configuration.
Uses `toiletdb` so that migrating to hyperdb in the future will be easy.
(toiletdb is a JSON-file manager designed to make writing .jsons safe.)

**/

const {join} = require('path')
const mkdirp = require('mkdirp')
const toiletdb = require('toiletdb')
const {promisify} = require('util')
const stat = promisify(require('fs').stat)
const {du, hasParam, paramHasType, promisifyObject, toKey} = require('./util')

// exported api
// =

class DatNodeStorage {
  constructor ({path}) {
    // validate arguments
    hasParam(path, 'path')
    paramHasType(path, 'string', 'path')
    this.path = path

    // make sure data dir exists
    mkdirp.sync(this.path)
    mkdirp.sync(join(this.path, 'dats'))

    // create dbs
    this._datsJson = promisifyObject(toiletdb(join(this.path, 'dats.json')))
    this._dnsJson = promisifyObject(toiletdb(join(this.path, 'dns.json')))
    this._datsJson.open()
    this._dnsJson.open()
  }

  _getDatPath (url) {
    return join(this.path, 'dats', toKey(url))
  }

  async list () {
    return Object.values(await this._datsJson.read('dats') || {})
  }

  async get (url) {
    var dats = await this._datsJson.read('dats') || {}
    return dats[toKey(url)]
  }

  async _set (datInfo) {
    var dats = await this._datsJson.read('dats') || {}
    dats[datInfo.key] = extractDatInfo(datInfo)
    await this._datsJson.write('dats', dats)
  }

  async delete (url) {
    var dats = await this._datsJson.read('dats') || {}
    delete dats[toKey(url)]
    await this._datsJson.write('dats', dats)
  }

  async getMtime (url) {
    var path = this._getDatPath(url)
    try {
      var st = await stat(path)
      return st.mtime
    } catch (e) {
      return 0
    }
  }

  async getDiskUsage (url) {
    var path = this._getDatPath(url)
    return await du(path)
  }

  async getDNSCache (hostname) {
    var cache = await this._dnsJson.read('cache') || {}
    return cache[hostname]
  }

  async setDNSCache (hostname, value) {
    var cache = await this._dnsJson.read('cache') || {}
    cache[hostname] = value
    await this._dnsJson.write('cache', cache)
  }

  async clearDNSCache (hostname) {
    var cache = await this._dnsJson.read('cache') || {}
    delete cache[hostname]
    await this._dnsJson.write('cache', cache)
  }
}

module.exports = DatNodeStorage

// internal
// =

function extractDatInfo (datInfo) {
  return {
    key: datInfo.key,
    dataStructureId: datInfo.dataStructureId
  }
}
