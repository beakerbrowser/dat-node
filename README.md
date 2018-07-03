# @beaker/dat-server

A toolkit for writing Dat-based services in nodejs.

```
npm install @beaker/dat-server
```

Provides the same Dat APIs that [Beaker browser](https://beakerbrowser.com) uses, so that code written which depends on the [DatArchive](https://beakerbrowser.com/docs/apis/dat.html) will work here and in the browser.

```js
const dat = require('@beaker/dat-server')

const server = dat.createServer({
  storage: './dat'
})
server.close()
server.createDebugLogStream()

server.getArchive('dat://beakerbrowser.com')
server.createArchive({title: 'My Archive'})
server.forkArchive('dat://beakerbrowser.com', {title: 'My Fork of the Beaker site'})

server.joinSwarm('dat://beakerbrowser.com')
server.leaveSwarm('dat://beakerbrowser.com')
server.isSwarming('dat://beakerbrowser.com')
server.listSwarming()

server.on('network-changed', (item, {connections}) => /*...*/)
server.on('download', (item, {feed, block, bytes}) => /*...*/)
server.on('upload', (item, {feed, block, bytes}) => /*...*/)
server.on('sync', (item, {feed}) => /*...*/)

await server.storage.list()
await server.storage.has('dat://beakerbrowser.com')
await server.storage.delete('dat://beakerbrowser.com')
await server.storage.getMtime('dat://beakerbrowser.com')
await server.storage.getDiskUsage('dat://beakerbrowser.com')
await server.storage.getDownloadProgress('dat://beakerbrowser.com')
await server.storage.isFullyDownloaded('dat://beakerbrowser.com')

await server.dns.resolve('dat://beakerbrowser.com')
```

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [API](#api)
  - [createServer(opts)](#createserveropts)
  - [DatServer](#datserver)
    - [server.storage](#serverstorage)
    - [server.dns](#serverdns)
    - [server.joinSwarm(url)](#serverjoinswarmurl)
    - [server.leaveSwarm(url)](#serverleaveswarmurl)
    - [server.isSwarming(url)](#serverisswarmingurl)
    - [server.listSwarming()](#serverlistswarming)
    - [server.getArchive(url)](#servergetarchiveurl)
    - [server.createArchive([opts])](#servercreatearchiveopts)
    - [server.forkArchive(url[, opts])](#serverforkarchiveurl-opts)
    - [server.close()](#serverclose)
    - [server.createDebugLogStream([opts])](#servercreatedebuglogstreamopts)
    - [Event: "network-changed"](#event-network-changed)
    - [Event: "download"](#event-download)
    - [Event: "upload" (url, {feed, block, bytes})](#event-upload-url-feed-block-bytes)
    - [Event: "sync" (url, {feed})](#event-sync-url-feed)
  - [DatServerStorage](#datserverstorage)
    - [storage.list()](#storagelist)
    - [storage.has(url)](#storagehasurl)
    - [storage.getMtime(url)](#storagegetmtimeurl)
    - [storage.getDiskUsage(url)](#storagegetdiskusageurl)
    - [storage.getDownloadProgress(url)](#storagegetdownloadprogressurl)
    - [storage.isFullyDownloaded(url)](#storageisfullydownloadedurl)
    - [storage.delete(url)](#storagedeleteurl)
  - [DatDNS](#datdns)
    - [dns.resolve(url)](#dnsresolveurl)
  - [DatArchive](#datarchive)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## API

### createServer(opts)

Create a new dat server. See the [`DatServer`](#datserver) API.

 - `opts`
   - `data`: String, the path at which all data is stored.
   - `autoSwarm:` Boolean, swarm dats by default when loaded? Defaults to true.

```js
var server = dat.createServer({
  data: './dat'
})
```

### DatServer

#### server.storage

A [`DatServerStorage`](#datserverstorage) instance.

#### server.dns

A [`DatDNS`](#datdns) instance.

#### server.joinSwarm(url)

Async. Load a dat into memory, add it to the local storage (if not yet present) and begin swarming. Does not need to be called if `autoSwarm` is true.

 - `url`: String, the url of the dat. Can provide a DNS shortname.

```js
await server.joinSwarm('dat://beakerbrowser.com')
```

#### server.leaveSwarm(url)

Stop swarming the given dat.

```js
server.leaveSwarm('dat://beakerbrowser.com')
```

Will not remove the dat's data from the local storage (see `server.storage.remove()`).

#### server.isSwarming(url)

Is the given dat in-memory and being actively swarmed?

 - `url`: String, the url of the dat. Can provide a DNS shortname.

```js
if (server.isSwarming('dat://beakerbrowser.com')) {
  console.log('is being swarmed')
}
```

#### server.listSwarming()

List the keys of in-memory and swarmed dats.

```js
var activeDats = server.listSwarming()
```

#### server.getArchive(url)

Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) with the given opts.

```js
var archive = server.getArchive('dat://beakerbrowser.com')
```

#### server.createArchive([opts])

Async. Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) with the given opts. Will automatically persist and swarm the archive.

 - `opts`
   - `title` String. The title of the new archive.
   - `description` String. The description of the new archive.

```js
var archive = await server.createArchive({title: 'My new archive'})
```

#### server.forkArchive(url[, opts])

 - `opts`
   - `title` String. The title of the new archive.
   - `description` String. The description of the new archive.
   
Async. Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) which duplicates the content of the given archive. Can optionally modify the manifest with `opts`.  Will automatically persist and swarm the archive.

```js
var archive = await server.forkArchive('dat://beakerbrowser.com', {title: 'My fork of the Beaker site'})
```

#### server.close()

Unswarm all dats.

#### server.createDebugLogStream([opts])

Get a readable string-stream containing the content of the debug log. Useful for providing debugging interfaces.

TODO decide what features this should include

#### Event: "network-changed"

A change in the network-connectivity of a given dat.

 - `url`. String. The dat url.
 - `connections`. Number. The number of connected peers.

```js
server.on('network-changed', (url, {connections}) => {
  // ...
})
```

#### Event: "download"

Some data has been downloaded.

 - `url`. String. The dat url.
 - `feed`. String. Which feed received data (e.g. 'metadata', 'content')
 - `block`. Number. The block index downloaded.
 - `bytes`. Number. How many bytes were downloaded.

```js
server.on('download', (url, {feed, block, bytes}) => {
  // ...
})
```

#### Event: "upload" (url, {feed, block, bytes})

Some data has been uploaded.

 - `url`. String. The dat url.
 - `feed`. String. Which feed sent data (e.g. 'metadata', 'content')
 - `block`. Number. The block index uploaded.
 - `bytes`. Number. How many bytes were uploaded.

```js
server.on('upload', (url, {feed, block, bytes}) => {
  // ...
})
```

#### Event: "sync" (url, {feed})

A feed has been fully downloaded.

 - `url`. String. The dat url.
 - `feed`. String. Which feed finished downloading (e.g. 'metadata', 'content')

```js
server.on('sync', (url, {feed}) => {
  // ...
})
```

### DatServerStorage

The local data store. Includes all data which is persisted onto disk. Can be found on the [`DatServer`](#datserver) API as `server.storage`.

#### storage.list()

Async. List the keys of locally-cached dats.

```js
var cachedDatKeys = await server.storage.list()
```

#### storage.has(url)

Async. Is the given dat in the cache?

```js
var isInCache = await server.storage.has('dat://beakerbrowser.com')
```

#### storage.getMtime(url)

Async. Get the modification time of the dat's data. (Tells you the last time new data was cached.)

```js
var mtime = await server.storage.getMtime('dat://beakerbrowser.com')
```

#### storage.getDiskUsage(url)

Async. Get the amount of bytes being used by the dat in the local cache.

```js
var bytes = await server.storage.getDiskUsage('dat://beakerbrowser.com')
```

#### storage.getDownloadProgress(url)

Async. Get the percentage of the total data downloaded (between 0 and 1).

```js
var pct = await server.storage.getDownloadProgress('dat://beakerbrowser.com')
```

#### storage.isFullyDownloaded(url)

Async. Is all of the dat's data cached?

```js
var pct = await server.storage.isFullyDownloaded('dat://beakerbrowser.com')
```

#### storage.delete(url)

Async. Delete all cached data for the dat.

```js
await server.storage.delete('dat://beakerbrowser.com')
```

### DatDNS

The DNS manager. Can be found on the [`DatServer`](#datserver) API as `server.dns`.

#### dns.resolve(url)

Async. Get the key of the given URL.

```js
var key = await server.dns.resolve('dat://beakerbrowser.com')
```

### DatArchive

A dat "archive" instance. See the [`DatArchive` API docs](https://beakerbrowser.com/docs/apis/dat.html).

```js
const dat = require('@beaker/dat-server')

const server = dat.createServer()
var archive = server.getArchive('dat://beakerbrowser.com')
await archive.readdir('/') => [...]
```
