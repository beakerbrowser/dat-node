const {createDaemon} = require('../index')
const tempy = require('tempy')

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

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

  // create archive
  var archive = await daemon.createArchive({title: 'My Archive'})
  archive.writeFile('/index.md', '# Sup!\n\n This was created by the @beaker/dat-daemon example code. See [the readme](https://npm.im/@beaker/dat-daemon) for more information.')

  // output url
  console.log('> Created archive:', archive.url)
}
main()