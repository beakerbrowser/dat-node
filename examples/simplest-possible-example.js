const {createNode} = require('../index')
const tempy = require('tempy')

var dat = createNode({path: tempy.directory()})
dat.createArchive({title: 'My Archive'})
  .then(archive => {
    console.log(archive.url)
    archive.writeFile('/index.md', '# Sup!')
  })
