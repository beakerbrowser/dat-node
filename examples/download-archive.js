const {createDaemon} = require('../index')
const tempy = require('tempy')
const fs = require('fs')
const mkdirp = require('mkdirp')
const {join} = require('path')

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

var datUrl = process.argv[2]
if (typeof datUrl !== 'string') {
  usage()
  process.exit(1)
}

function usage () {
  console.log('Usage: node download-archive.js [url]')
}

async function main () {
  // instantiate a new dat daemon
  var storage = tempy.directory()
  console.log('> Starting daemon, data dir:', storage)
  const daemon = createDaemon({storage, port: 0})

  // bind to events
  daemon.on('listening', (port) => console.log(' (i) Daemon listening on', port))
  daemon.swarm.on('join', ({key, discoveryKey}) => console.log(' (i) Joined swarm'))
  daemon.swarm.on('leave', ({key, discoveryKey}) => console.log(' (i) Left swarm'))
  daemon.swarm.on('connection', ({remoteAddress, remotePort, key}) => console.log(' (i) New connection', `${remoteAddress}:${remotePort}`, 'for', key))
  daemon.swarm.on('connection-closed', ({remoteAddress, remotePort, key}) => console.log(' (i) Connection closed', `${remoteAddress}:${remotePort}`, 'for', key))
  daemon.on('error', err => {
    console.error(err)
    process.exit(1)
  })

  // fetch archive
  console.log('> Fetching archive:', datUrl)
  var archive = await daemon.getArchive(datUrl)
  console.log('> Downloading...')
  await archive.download('/')

  // write to dir
  var targetPath = join(__dirname, archive.url.slice(6, 12))
  console.log('> Writing to', targetPath)
  await writeArchiveTo(archive, targetPath)

  // close up
  console.log('> Done!')
  daemon.close()
}
main()

// recursive method to copy out the archive
async function writeArchiveTo (archive, dstPath, srcPath = '/') {
  let st = await archive.stat(srcPath)
  if (st.isDirectory()) {
    console.log('> Making directory', dstPath)
    mkdirp.sync(dstPath)
    let names = await archive.readdir('/')
    for (let name of names) {
      await writeArchiveTo(archive, join(dstPath, name), join(srcPath, name))
    }
  } else if (st.isFile()) {
    console.log('> Copying', srcPath, 'to', dstPath)
    fs.writeFileSync(dstPath, await archive.readFile(srcPath))
  }
}