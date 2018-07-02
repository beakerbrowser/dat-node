# Dat for Nodejs ("Beaker" edition)

A toolkit for writing Dat-based services in nodejs.

Provides the same Dat APIs that [Beaker browser](https://beakerbrowser.com) uses, so that code written which depends on the [DatArchive](https://beakerbrowser.com/docs/apis/dat.html) will work here and in the browser.

```
npm install @beaker/dat-node
```

```js
const {Dat, DatArchive} = require('@beaker/dat-node')

// initialize your default instance
// (you must call this first!)
Dat.setup({
  data: './dat' // where to store the dat data
})

// create and use an archive instance
var archive = new DatArchive('dat://beakerbrowser.com')
await archive.readdir('/') => [...]
```

Currently includes:

 - Dat-management APIs
 - Swarm APIs
 - [DatArchive API](https://beakerbrowser.com/docs/apis/dat.html)

Planned additions:

 - DatFeed API (once implemented in Beaker)
 - DatDB API (once implemented in Beaker)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [API](#api)
  - [DatArchive](#datarchive)
  - [Dat](#dat)
    - [Dat.setup(opts)](#datsetupopts)
    - [Dat.list()](#datlist)
    - [Dat.load(url[, opts])](#datloadurl-opts)
    - [Dat.reconfigure(url, opts)](#datreconfigureurl-opts)
    - [Dat.get(url)](#datgeturl)
    - [Dat.isLoaded(url)](#datisloadedurl)
    - [Dat.unload(url)](#datunloadurl)
    - [Dat.createDebugLogStream([opts])](#datcreatedebuglogstreamopts)
  - [DatInfo](#datinfo)
  - [Cache](#cache)
    - [Dat.cache.list()](#datcachelist)
    - [Dat.cache.has(url)](#datcachehasurl)
    - [Dat.cache.getMTime(url)](#datcachegetmtimeurl)
    - [Dat.cache.getDiskUsage(url)](#datcachegetdiskusageurl)
    - [Dat.cache.getDownloadProgress(url)](#datcachegetdownloadprogressurl)
    - [Dat.cache.isFullyDownloaded(url)](#datcacheisfullydownloadedurl)
    - [Dat.cache.delete(url)](#datcachedeleteurl)
  - [DNS](#dns)
    - [Dat.dns.resolve(url)](#datdnsresolveurl)
  - [Events](#events)
    - ["network-changed" (url, {connections})](#network-changed-url-connections)
    - ["download" (url, {feed, block, bytes})](#download-url-feed-block-bytes)
    - ["upload" (url, {feed, block, bytes})](#upload-url-feed-block-bytes)
    - ["sync" (url, {feed})](#sync-url-feed)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## API

### DatArchive

See the [`DatArchive` API docs](https://beakerbrowser.com/docs/apis/dat.html).

```js
const {DatArchive} = require('@beaker/dat-node')

var archive = new DatArchive('dat://beakerbrowser.com')
await archive.readdir('/') => [...]
```

### Dat

The management interface. Controls the "behind the scenes."

#### Dat.setup(opts)

Initialize the `Dat`. Must be called before any other method is called.

 - `opts`
   - `data`: String, the path at which all data is stored.

```js
Dat.setup({
  data: './dat'
})
```

#### Dat.list()

List the active, in-memory dats.

```js
var activeDats = Dat.list()
```

Provides an array of `DatInfo` objects.

#### Dat.load(url[, opts])

Async. Load a dat into memory, add it to the cache (if not yet present) and begin swarming.

 - `url`: String, the url of the dat. Can provide a DNS shortname.
 - `opts`
   - `swarm`: Boolean, default true

```js
await Dat.load('dat://beakerbrowser.com')
```

#### Dat.reconfigure(url, opts)

Update the configuration of a dat which is already in memory.

 - `url`: String, the url of the dat. Can provide a DNS shortname.
 - `opts`
   - `swarm`: Boolean

```js
Dat.reconfigure('dat://beakerbrowser.com', {
  swarm: false
})
```

#### Dat.get(url)

Get the `DatInfo` for the given URL. Will return `false` if not loaded in memory.

 - `url`: String, the url of the dat. Can provide a DNS shortname.

```js
var datInfo = Dat.get('dat://beakerbrowser.com')
```

#### Dat.isLoaded(url)

Is the given dat in-memory?

 - `url`: String, the url of the dat. Can provide a DNS shortname.

```js
if (Dat.isLoaded('dat://beakerbrowser.com')) {
  console.log('is in memory')
}
```

#### Dat.unload(url)

Remove the given dat from memory and stop swarming it.

```js
Dat.unload('dat://beakerbrowser.com')
```

Will not remove the dat's data from the local cache (see `Dat.cache.remove()`).

#### Dat.createDebugLogStream([opts])

Get a readable string-stream containing the content of the debug log. Useful for providing debugging interfaces.

TODO decide what features this should include

### DatInfo

The class of objects returned frequently by `Dat` functions.

```
DatInfo {
  url: String
  dataStructure: String, the kind of dat (eg 'hypercore', 'hyperdrive')
  isOwner: Boolean
  config: {
    swarming: Boolean
  }
}
```

### Cache

The local data store. Includes all data which is persisted between runs.

#### Dat.cache.list()

Async. List the keys of locally-cached dats.

```js
var cachedDatKeys = await Dat.cache.list()
```

#### Dat.cache.has(url)

Async. Is the given dat in the cache?

```js
var isInCache = await Dat.cache.has('dat://beakerbrowser.com')
```

#### Dat.cache.getMTime(url)

Async. Get the modification time of the dat's data. (Tells you the last time new data was cached.)

```js
var mtime = await Dat.cache.getMTime('dat://beakerbrowser.com')
```

#### Dat.cache.getDiskUsage(url)

Async. Get the amount of bytes being used by the dat in the local cache.

```js
var bytes = await Dat.cache.getDiskUsage('dat://beakerbrowser.com')
```

#### Dat.cache.getDownloadProgress(url)

Async. Get the percentage of the total data downloaded (between 0 and 1).

```js
var pct = await Dat.cache.getDownloadProgress('dat://beakerbrowser.com')
```

#### Dat.cache.isFullyDownloaded(url)

Async. Is all of the dat's data cached?

```js
var pct = await Dat.cache.isFullyDownloaded('dat://beakerbrowser.com')
```

#### Dat.cache.delete(url)

Async. Delete all cached data for the dat.

```js
await Dat.cache.delete('dat://beakerbrowser.com')
```

### DNS

#### Dat.dns.resolve(url)

Async. Get the key of the given URL.

```js
var key = await Dat.dns.resolve('dat://beakerbrowser.com')
```

### Events

Events emitted by the `Dat` object.

#### "network-changed" (url, {connections})

A change in the network-connectivity of a given dat.

 - `url`. String. The dat url.
 - `connections`. Number. The number of connected peers.

```js
Dat.on('network-changed', (url, {connections}) => {
  // ...
})
```

#### "download" (url, {feed, block, bytes})

Some data has been downloaded.

 - `url`. String. The dat url.
 - `feed`. String. Which feed received data (e.g. 'metadata', 'content')
 - `block`. Number. The block index downloaded.
 - `bytes`. Number. How many bytes were downloaded.

```js
Dat.on('download', (url, {feed, block, bytes}) => {
  // ...
})
```

#### "upload" (url, {feed, block, bytes})

Some data has been uploaded.

 - `url`. String. The dat url.
 - `feed`. String. Which feed sent data (e.g. 'metadata', 'content')
 - `block`. Number. The block index uploaded.
 - `bytes`. Number. How many bytes were uploaded.

```js
Dat.on('upload', (url, {feed, block, bytes}) => {
  // ...
})
```

#### "sync" (url, {feed})

A feed has been fully downloaded.

 - `url`. String. The dat url.
 - `feed`. String. Which feed finished downloading (e.g. 'metadata', 'content')

```js
Dat.on('sync', (url, {feed}) => {
  // ...
})
```
