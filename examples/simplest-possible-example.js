const {createDaemon} = require('../index')
const tempy = require('tempy')

var daemon = createDaemon({storage: tempy.directory(), port: 0})
daemon.createArchive({title: 'My Archive'})
  .then(archive => {
    console.log(archive.url)
    archive.writeFile('/index.md', '# Sup!')
  })
