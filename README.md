# @beaker/dat-daemon

A toolkit for writing Dat-based services in nodejs.

```js
const {createDaemon} = require('@beaker/dat-daemon')

// instantiate a new dat daemon
const daemon = createDaemon({
  storage: './dat'
})

// get, create, or fork archives
var archive = await daemon.getArchive('dat://beakerbrowser.com')
var archive = await daemon.createArchive({title: 'My Archive'})
var archive = await daemon.forkArchive('dat://beakerbrowser.com', {title: 'My Fork of the Beaker site'})

// you can read & write files within the archive
var filenames = await archive.readdir('/')
var filedata = await archive.readFile('/index.html', 'utf8')
await archive.mkdir('/new')
await archive.writeFile('/new/thing.json', JSON.stringify({hi: 'world'}))
archive.watch('/new/*.json').addEventListener('changed', ...) // file changed

// listen to global network events
daemon.on('network-changed', ...) // change to network conditions (aka new peer)
daemon.on('download', ...) // data was downloaded
daemon.on('upload', ...) // data was uploaded
daemon.on('sync', ...) // a feed was synced

// get internal information about a dat
await daemon.getMtime('dat://beakerbrowser.com') // unix timestamp of last change to the dat
await daemon.getDiskUsage('dat://beakerbrowser.com') // in bytes
await daemon.getSyncProgress('dat://beakerbrowser.com') // 0-1, where 1 is 100% synced
```

Provides the same Dat APIs that [Beaker browser](https://beakerbrowser.com) uses, so that code written which depends on the [DatArchive](https://beakerbrowser.com/docs/apis/dat.html) will work here and in the browser.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [createDaemon(opts)](#createdaemonopts)
- [DatDaemon](#datdaemon)
  - [daemon.listen([port])](#daemonlistenport)
  - [daemon.close()](#daemonclose)
  - [daemon.getArchive(url)](#daemongetarchiveurl)
  - [daemon.createArchive([opts])](#daemoncreatearchiveopts)
  - [daemon.forkArchive(url[, opts])](#daemonforkarchiveurl-opts)
  - [daemon.getMtime(url)](#daemongetmtimeurl)
  - [daemon.getDiskUsage(url)](#daemongetdiskusageurl)
  - [daemon.getSyncProgress(url)](#daemongetsyncprogressurl)
  - [daemon.isFullySynced(url)](#daemonisfullysyncedurl)
  - [daemon.createDebugLogStream([opts])](#daemoncreatedebuglogstreamopts)
  - [daemon.storage](#daemonstorage)
  - [daemon.swarm](#daemonswarm)
  - [daemon.dns](#daemondns)
  - [daemon.networkId](#daemonnetworkid)
  - [Event: "network-changed"](#event-network-changed)
  - [Event: "download"](#event-download)
  - [Event: "upload" (url, {feed, block, bytes})](#event-upload-url-feed-block-bytes)
  - [Event: "sync" (url, {feed})](#event-sync-url-feed)
- [DatDaemonStorage](#datdaemonstorage)
  - [storage.list()](#storagelist)
  - [storage.get(url)](#storagegeturl)
  - [storage.delete(url)](#storagedeleteurl)
  - [storage.getMtime(url)](#storagegetmtimeurl)
  - [storage.getDiskUsage(url)](#storagegetdiskusageurl)
  - [storage.getSyncProgress(url)](#storagegetsyncprogressurl)
  - [storage.isFullySynced(url)](#storageisfullysyncedurl)
  - [storage.getDNSCache(hostname)](#storagegetdnscachehostname)
  - [storage.setDNSCache(hostname, value)](#storagesetdnscachehostname-value)
  - [storage.clearDNSCache(hostname)](#storagecleardnscachehostname)
- [DatDaemonSwarm](#datdaemonswarm)
  - [swarm.join(url)](#swarmjoinurl)
  - [swarm.leave(url)](#swarmleaveurl)
- [DatDNS](#datdns)
  - [dns.resolve(url)](#dnsresolveurl)
- [DatArchive](#datarchive)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## createDaemon(opts)

Create a new dat daemon. See the [`DatDaemon`](#DatDaemon) API.

 - **opts**
   - **data**: String, the path at which all data is stored.
   - **autoSwarm**` Boolean, swarm dats by default when loaded? Defaults to true.
   - **autoListen**: Boolean, bind a port automatically after load. Defaults to true.
   - **port**: Number, the port to bind to. Defaults to 3282.

```js
const {createDaemon} = require('@beaker/dat-daemon')

var daemon = createDaemon({
  data: './dat'
})
```

## DatDaemon

### daemon.listen([port])

Start listening for connections in the dat network. Only need to call if [`createDaemon`](#createdaemon) is called with `{autoListen: false}`, or if `daemon.close()` has been called.

 - **port**. Number. The port to listen for connections on. Defaults to 3282.

### daemon.close()

Unswarm all dats and stop listening.

### daemon.getArchive(url)

Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) with the given opts.

```js
var archive = daemon.getArchive('dat://beakerbrowser.com')
```

### daemon.createArchive([opts])

Async. Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) with the given opts. Will automatically persist and swarm the archive.

 - **opts**
   - **title** String. The title of the new archive.
   - **description** String. The description of the new archive.

```js
var archive = await daemon.createArchive({title: 'My new archive'})
```

### daemon.forkArchive(url[, opts])

 - **opts**
   - **title** String. The title of the new archive.
   - **description** String. The description of the new archive.
   
Async. Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) which duplicates the content of the given archive. Can optionally modify the manifest with `opts`.  Will automatically persist and swarm the archive.

```js
var archive = await daemon.forkArchive('dat://beakerbrowser.com', {title: 'My fork of the Beaker site'})
```

### daemon.getMtime(url)

Async. Get the modification time of the dat's data. (Tells you the last time new data was written.)

```js
var mtime = await daemon.getMtime('dat://beakerbrowser.com')
```

### daemon.getDiskUsage(url)

Async. Get the amount of bytes being used by the dat in the local cache.

```js
var bytes = await daemon.getDiskUsage('dat://beakerbrowser.com')
```

### daemon.getSyncProgress(url)

Async. Get the percentage of the total data downloaded (between 0 and 1).

```js
var pct = await daemon.getSyncProgress('dat://beakerbrowser.com')
```

### daemon.isFullySynced(url)

Async. Is all of the dat's data cached?

```js
var pct = await daemon.isFullySynced('dat://beakerbrowser.com')
```

### daemon.createDebugLogStream([opts])

Get a readable string-stream containing the content of the debug log. Useful for providing debugging interfaces.

TODO decide what features this should include

### daemon.storage

A [`DatDaemonStorage`](#datDaemonstorage) instance.

### daemon.swarm

A [`DatDaemonSwarm`](#datdaemonswarm) instance.

### daemon.dns

A [`DatDNS`](#datdns) instance.

### daemon.networkId

A 32-byte buffer containing a randomly-generated ID, used to deduplicate connections.

### Event: "network-changed"

A change in the network-connectivity of a given dat.

 - **url**. String. The dat url.
 - **connections**. Number. The number of connected peers.

```js
daemon.on('network-changed', (url, {connections}) => {
  // ...
})
```

### Event: "download"

Some data has been downloaded.

 - **url**. String. The dat url.
 - **feed**. String. Which feed received data (e.g. 'metadata', 'content')
 - **block**. Number. The block index downloaded.
 - **bytes**. Number. How many bytes were downloaded.

```js
daemon.on('download', (url, {feed, block, bytes}) => {
  // ...
})
```

### Event: "upload" (url, {feed, block, bytes})

Some data has been uploaded.

 - **url**. String. The dat url.
 - **feed**. String. Which feed sent data (e.g. 'metadata', 'content')
 - **block**. Number. The block index uploaded.
 - **bytes**. Number. How many bytes were uploaded.

```js
daemon.on('upload', (url, {feed, block, bytes}) => {
  // ...
})
```

### Event: "sync" (url, {feed})

A feed has been fully downloaded.

 - **url**. String. The dat url.
 - **feed**. String. Which feed finished downloading (e.g. 'metadata', 'content')

```js
daemon.on('sync', (url, {feed}) => {
  // ...
})
```

## DatDaemonStorage

The local data store. Includes all data which is persisted onto disk. Can be found on the [`DatDaemon`](#DatDaemon) API as `daemon.storage`.

### storage.list()

Async. List the metadata of locally-stored dats.

```js
var datInfos = await daemon.storage.list()
```

### storage.get(url)

Async. Fetch the stored metadata about the archive. Returns `null` if not present locally.

```js
var datInfo = await daemon.storage.get('dat://beakerbrowser.com')
```

### storage.delete(url)

Async. Delete all cached data for the dat.

```js
await daemon.storage.delete('dat://beakerbrowser.com')
```

### storage.getMtime(url)

Async. Get the modification time of the dat's data. (Tells you the last time new data was written.)

```js
var mtime = await daemon.storage.getMtime('dat://beakerbrowser.com')
```

### storage.getDiskUsage(url)

Async. Get the amount of bytes being used by the dat in the local cache.

```js
var bytes = await daemon.storage.getDiskUsage('dat://beakerbrowser.com')
```

### storage.getSyncProgress(url)

Async. Get the percentage of the total data downloaded (between 0 and 1).

```js
var pct = await daemon.storage.getSyncProgress('dat://beakerbrowser.com')
```

### storage.isFullySynced(url)

Async. Is all of the dat's data cached?

```js
var pct = await daemon.storage.isFullySynced('dat://beakerbrowser.com')
```

### storage.getDNSCache(hostname)

Async. Get the disk-cached DNS lookup result for the given hostname.

 - **hostname** String.

### storage.setDNSCache(hostname, value)

Async. Set the disk-cached DNS lookup result for the given hostname.

 - **hostname** String.
 - **value** String.

### storage.clearDNSCache(hostname)

Async. Remove the disk-cached DNS lookup result for the given hostname.

 - **hostname** String.

## DatDaemonSwarm

### swarm.join(url)

Async. Load a dat into memory, add it to the local storage (if not yet present) and begin swarming. Does not need to be called if `autoSwarm` is true.

 - **url**: String, the url of the dat. Can provide a DNS shortname.

```js
await daemon.swarm.join('dat://beakerbrowser.com')
```

### swarm.leave(url)

Async. Stop swarming the given dat.

```js
await daemon.swarm.leave('dat://beakerbrowser.com')
```

Will not remove the dat's data from the local storage (see `daemon.storage.remove()`).

## DatDNS

The DNS manager. Can be found on the [`DatDaemon`](#DatDaemon) API as `daemon.dns`.

### dns.resolve(url)

Async. Get the key of the given URL.

```js
var key = await daemon.dns.resolve('dat://beakerbrowser.com')
```

## DatArchive

A dat "archive" instance. See the [`DatArchive` API docs](https://beakerbrowser.com/docs/apis/dat.html).

```js
const dat = require('@beaker/dat-daemon')

const daemon = dat.createDaemon()
var archive = daemon.getArchive('dat://beakerbrowser.com')
await archive.readdir('/') => [...]
```
