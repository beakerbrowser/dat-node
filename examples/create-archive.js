const {createNode} = require('../index')
const tempy = require('tempy')

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

async function main () {
  // instantiate a new dat node
  var storage = tempy.directory()
  console.log('> Starting dat, data dir:', storage)
  const dat = createNode({path: storage})

  // bind to events
  dat.on('listening', (port) => console.log(' (i) Swarm listening on', port))
  dat.swarm.on('join', ({key, discoveryKey}) => console.log(' (i) Joined swarm'))
  dat.swarm.on('leave', ({key, discoveryKey}) => console.log(' (i) Left swarm'))
  dat.swarm.on('connection', ({remoteAddress, remotePort, key}) => console.log(' (i) New connection', `${remoteAddress}:${remotePort}`, 'for', key))
  dat.swarm.on('connection-closed', ({remoteAddress, remotePort, key}) => console.log(' (i) Connection closed', `${remoteAddress}:${remotePort}`, 'for', key))
  dat.on('error', err => {
    console.error(err)
    process.exit(1)
  })

  // create archive
  var archive = await dat.createArchive({title: 'My Archive'})
  archive.writeFile('/index.md', '# Sup!\n\n This was created by the @beaker/dat-node example code. See [the readme](https://npm.im/@beaker/dat-node) for more information.')

  // output url
  console.log('> Created archive:', archive.url)
}
main()