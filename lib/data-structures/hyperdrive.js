const signatures = require('sodium-signatures')
const datEncoding = require('dat-encoding')
const mkdirp = require('mkdirp')
const createHyperdrive = require('hyperdrive')
const pda = require('pauls-dat-api')
const {DAT_PRESERVED_FIELDS_ON_FORK} = require('../const')
const {log, hasParam, paramHasType, toKey} = require('../util')

// exported api
// =

exports.load = function load (daemon, key) {
  hasParam(key, 'key')
  paramHasType(key, 'string', 'key')

  var datInfo = {key, dataStructureId: 'hyperdrive', discoveryKey: undefined, loadPromise: undefined, dataStructure: undefined, isSwarming: false}
  var p = datInfo.loadPromise = loadInner(daemon, datInfo, key, null)
  p.catch(err => {
    console.error('Failed to load archive', err)
  })

  return datInfo
}

exports.create = async function create (daemon, manifest = {}) {
  // create key
  var kp = signatures.keyPair()
  var key = kp.publicKey
  var secretKey = kp.secretKey

  // create the archive
  var datInfo = {key: toKey(key), dataStructureId: 'hyperdrive', discoveryKey: undefined, loadPromise: undefined, dataStructure: undefined, isSwarming: false}
  var p = datInfo.loadPromise = loadInner(daemon, datInfo, key, secretKey)
  p.catch(err => {
    console.error('Failed to create archive', err)
  })
  await p

  // write the manifest
  pda.writeManifest(datInfo.dataStructure, manifest)

  return datInfo
}

exports.fork = async function fork (daemon, srcKey, manifest = {}) {
  hasParam(srcKey, 'srcKey')
  paramHasType(srcKey, 'string', 'srcKey')

  // fetch source
  await daemon.getArchive(srcKey)
  var srcDat = daemon._dats[srcKey]

  // get source manifest
  var srcManifest = await (pda.readManifest(srcDat.dataStructure).catch(_ => ({})))

  // override any manifest data
  var dstManifest = {
    title: (manifest.title) ? manifest.title : srcManifest.title,
    description: (manifest.description) ? manifest.description : srcManifest.description,
    type: (manifest.type) ? manifest.type : srcManifest.type
  }
  DAT_PRESERVED_FIELDS_ON_FORK.forEach(field => {
    if (srcManifest[field]) {
      dstManifest[field] = srcManifest[field]
    }
  })

  // create the new archive
  var dstDat = await exports.create(daemon, dstManifest)

  // copy files
  await pda.exportArchiveToArchive({
    srcArchive: srcDat.dataStructure,
    dstArchive: dstDat.dataStructure,
    skipUndownloadedFiles: true,
    ignore: ['/.dat', '/.git', '/dat.json']
  })

  return dstDat
}

// internal
// =

// main logic, separated out so we can capture the promise
async function loadInner (daemon, datInfo, key, secretKey) {
  // ensure the folders exist
  var datPath = daemon.storage._getDatPath(key)
  mkdirp.sync(datPath)

  // create the archive instance
  var archive = createHyperdrive(datPath, datEncoding.toBuf(key), {
    sparse: true,
    secretKey,
    metadataStorageCacheSize: 0,
    contentStorageCacheSize: 0,
    treeCacheSize: 2048
  })
  archive.on('error', err => {
    console.error('Error in archive', key.toString('hex'), err)
    log(daemon, 'Error in archive', key.toString('hex'), err)
  })
  archive.metadata.on('peer-add', () => onNetworkChanged(datInfo))
  archive.metadata.on('peer-remove', () => onNetworkChanged(datInfo))
  datInfo.replicationStreams = [] // list of all active replication streams

  // wait for ready
  await new Promise((resolve, reject) => {
    archive.ready(err => {
      if (err) reject(err)
      else resolve()
    })
  })

  // store in the daemon listings
  datInfo.dataStructure = archive
  datInfo.discoveryKey = datEncoding.toStr(archive.discoveryKey)
  daemon._datsByDKey[datInfo.discoveryKey] = datInfo
  daemon._dats[datInfo.key] = datInfo

  // autoswarm
  if (daemon.autoSwarm) {
    daemon.swarm.join(datInfo.key)
  }

  // await initial metadata sync if not the owner
  if (!archive.writable && !archive.metadata.length) {
    // wait to receive a first update
    await new Promise((resolve, reject) => {
      archive.metadata.update(err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
  if (!archive.writable) {
    // always download all metadata
    archive.metadata.download({start: 0, end: -1})
  }

  archive.on('error', error => {
    log(daemon, archive.key.toString('hex'), {
      event: 'error',
      message: error.toString()
    })
  })
}

function onNetworkChanged (dat) {
  // TODO decide how this should work

  /* // count # of peers
  var totalPeerCount = 0
  for (var k in archives) {
    totalPeerCount += archives[k].metadata.peers.length
  }
  archivesEvents.emit('network-changed', {
    details: {
      url: `dat://${datEncoding.toStr(archive.key)}`,
      peers: getArchivePeerInfos(archive),
      peerCount: archive.metadata.peers.length,
      totalPeerCount
    }
  }) */
}
