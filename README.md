# @beaker/dat-node

A toolkit for writing Dat-based services in nodejs.

```js
const {createNode} = require('@beaker/dat-node')

// instantiate a new dat node
const dat = createNode({
  storage: './dat'
})

// get, create, or fork archives
var archive = await dat.getArchive('dat://beakerbrowser.com')
var archive = await dat.createArchive({title: 'My Archive'})
var archive = await dat.forkArchive('dat://beakerbrowser.com', {title: 'My Fork of the Beaker site'})

// you can read & write files within the archive
var filedata  = await archive.readFile('/index.html', 'utf8')
await archive.writeFile('/new/thing.json', JSON.stringify({hi: 'world'}))

// listen to global network events
dat.on('network-changed', ...) // change to network conditions (aka new peer)
dat.on('download', ...) // data was downloaded
dat.on('upload', ...) // data was uploaded
dat.on('sync', ...) // a feed was synced

// get internal information about a dat
await dat.getMtime('dat://beakerbrowser.com') // unix timestamp of last change to the dat
await dat.getDiskUsage('dat://beakerbrowser.com') // in bytes
await dat.getSyncProgress('dat://beakerbrowser.com') // 0-1, where 1 is 100% synced
```

Provides the same Dat APIs that [Beaker browser](https://beakerbrowser.com) uses, so that code written which depends on the [DatArchive](https://beakerbrowser.com/docs/apis/dat.html) will work here and in the browser.

## TODOs

This repo is a work in progress. It still needs:

 - [ ] Tests
 - [ ] DNS shortnames
 - [ ] getSyncProgress() implementation
 - [ ] DatNode events
 - [ ] Probably more

## Examples

### 👉 [simplest-possible-example.js](./examples/simplest-possible-example.js)

```bash
node examples/simplest-possible-example.js
```

### 👉 [create-archive.js](./examples/create-archive.js)

```bash
node examples/create-archive.js
```

### 👉 [download-archive.js](./examples/download-archive.js)

```bash
node examples/download-archive.js dat://beakerbrowser.com
```

## API

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [createNode(opts)](#createnodeopts)
- [DatNode](#datnode)
  - [dat.listen([port])](#datlistenport)
  - [dat.close()](#datclose)
  - [dat.getArchive(url)](#datgetarchiveurl)
  - [dat.createArchive([opts])](#datcreatearchiveopts)
  - [dat.forkArchive(url[, opts])](#datforkarchiveurl-opts)
  - [dat.getMtime(url)](#datgetmtimeurl)
  - [dat.getDiskUsage(url)](#datgetdiskusageurl)
  - [dat.getSyncProgress(url)](#datgetsyncprogressurl)
  - [dat.isFullySynced(url)](#datisfullysyncedurl)
  - [dat.createDebugLogStream([opts])](#datcreatedebuglogstreamopts)
  - [dat.storage](#datstorage)
  - [dat.swarm](#datswarm)
  - [dat.dns](#datdns)
  - [Event: "listening"](#event-listening)
  - [Event: "error"](#event-error)
  - [Event: "network-changed"](#event-network-changed)
  - [Event: "download"](#event-download)
  - [Event: "upload" (url, {feed, block, bytes})](#event-upload-url-feed-block-bytes)
  - [Event: "sync" (url, {feed})](#event-sync-url-feed)
- [DatNodeStorage](#datnodestorage)
  - [storage.list()](#storagelist)
  - [storage.get(url)](#storagegeturl)
  - [storage.delete(url)](#storagedeleteurl)
  - [storage.getMtime(url)](#storagegetmtimeurl)
  - [storage.getDiskUsage(url)](#storagegetdiskusageurl)
  - [storage.getDNSCache(hostname)](#storagegetdnscachehostname)
  - [storage.setDNSCache(hostname, value)](#storagesetdnscachehostname-value)
  - [storage.clearDNSCache(hostname)](#storagecleardnscachehostname)
- [DatNodeSwarm](#datnodeswarm)
  - [swarm.join(url)](#swarmjoinurl)
  - [swarm.leave(url)](#swarmleaveurl)
  - [swarm.port](#swarmport)
  - [swarm.networkId](#swarmnetworkid)
  - [Event: "listening"](#event-listening-1)
  - [Event: "error"](#event-error-1)
  - [Event: "peer"](#event-peer)
  - [Event: "peer-banned"](#event-peer-banned)
  - [Event: "peer-rejected"](#event-peer-rejected)
  - [Event: "drop"](#event-drop)
  - [Event: "connecting"](#event-connecting)
  - [Event: "connect-failed"](#event-connect-failed)
  - [Event: "handshaking"](#event-handshaking)
  - [Event: "handshake-timeout"](#event-handshake-timeout)
  - [Event: "connection"](#event-connection)
  - [Event: "connection-closed"](#event-connection-closed)
  - [Event: "redundant-connection"](#event-redundant-connection)
- [DatDNS](#datdns)
  - [dns.resolve(url)](#dnsresolveurl)
- [DatArchive](#datarchive)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## createNode(opts)

Create a new dat dat. See the [`DatNode`](#DatNode) API.

 - **opts**
   - **storage**: String, the path at which all data is stored.
   - **autoSwarm**` Boolean, swarm dats by default when loaded? Defaults to true.
   - **autoListen**: Boolean, bind a port automatically after load. Defaults to true.
   - **port**: Number, the port to bind to. Defaults to 3282.

```js
const {createNode} = require('@beaker/dat-node')

var dat = createNode({
  storage: './dat'
})
```

## DatNode

### dat.listen([port])

Async. Start listening for connections in the dat network. Only need to call if [`createNode`](#createnode) is called with `{autoListen: false}`, or if `dat.close()` has been called.

 - **port**. Number. The port to listen for connections on. Defaults to 3282.

### dat.close()

Async. Unswarm all dats and stop listening.

### dat.getArchive(url)

Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) with the given opts.

```js
var archive = dat.getArchive('dat://beakerbrowser.com')
```

### dat.createArchive([opts])

Async. Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) with the given opts. Will automatically persist and swarm the archive.

 - **opts**
   - **title** String. The title of the new archive.
   - **description** String. The description of the new archive.

```js
var archive = await dat.createArchive({title: 'My new archive'})
```

### dat.forkArchive(url[, opts])

 - **opts**
   - **title** String. The title of the new archive.
   - **description** String. The description of the new archive.
   
Async. Create a new [`DatArchive`](https://beakerbrowser.com/docs/apis/dat.html) which duplicates the content of the given archive. Can optionally modify the manifest with `opts`.  Will automatically persist and swarm the archive.

```js
var archive = await dat.forkArchive('dat://beakerbrowser.com', {title: 'My fork of the Beaker site'})
```

### dat.getMtime(url)

Async. Get the modification time of the dat's data. (Tells you the last time new data was written.)

```js
var mtime = await dat.getMtime('dat://beakerbrowser.com')
```

### dat.getDiskUsage(url)

Async. Get the amount of bytes being used by the dat in the local cache.

```js
var bytes = await dat.getDiskUsage('dat://beakerbrowser.com')
```

### dat.getSyncProgress(url)

Async. Get the percentage of the total data downloaded (between 0 and 1).

```js
var pct = await dat.getSyncProgress('dat://beakerbrowser.com')
```

### dat.isFullySynced(url)

Async. Is all of the dat's data cached?

```js
var pct = await dat.isFullySynced('dat://beakerbrowser.com')
```

### dat.createDebugLogStream([opts])

Get a readable string-stream containing the content of the debug log. Useful for providing debugging interfaces.

TODO decide what features this should include

### dat.storage

A [`DatNodeStorage`](#datnodestorage) instance.

### dat.swarm

A [`DatNodeSwarm`](#datnodeswarm) instance.

### dat.dns

A [`DatDNS`](#datdns) instance.

### Event: "listening"

The swarm port is now bound and listening.

 - **port**. Number.

### Event: "error"

A critical error has occurred.

 - **err**. Error.

### Event: "network-changed"

A change in the network-connectivity of a given dat.

 - **url**. String. The dat url.
 - **connections**. Number. The number of connected peers.

```js
dat.on('network-changed', (url, {connections}) => {
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
dat.on('download', (url, {feed, block, bytes}) => {
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
dat.on('upload', (url, {feed, block, bytes}) => {
  // ...
})
```

### Event: "sync" (url, {feed})

A feed has been fully downloaded.

 - **url**. String. The dat url.
 - **feed**. String. Which feed finished downloading (e.g. 'metadata', 'content')

```js
dat.on('sync', (url, {feed}) => {
  // ...
})
```

## DatNodeStorage

The local data store. Includes all data which is persisted onto disk. Can be found on the [`DatNode`](#DatNode) API as `dat.storage`.

### storage.list()

Async. List the metadata of locally-stored dats.

```js
var datInfos = await dat.storage.list()
```

### storage.get(url)

Async. Fetch the stored metadata about the archive. Returns `null` if not present locally.

```js
var datInfo = await dat.storage.get('dat://beakerbrowser.com')
```

### storage.delete(url)

Async. Delete all cached data for the dat.

```js
await dat.storage.delete('dat://beakerbrowser.com')
```

### storage.getMtime(url)

Async. Get the modification time of the dat's data. (Tells you the last time new data was written.)

```js
var mtime = await dat.storage.getMtime('dat://beakerbrowser.com')
```

### storage.getDiskUsage(url)

Async. Get the amount of bytes being used by the dat in the local cache.

```js
var bytes = await dat.storage.getDiskUsage('dat://beakerbrowser.com')
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

## DatNodeSwarm

### swarm.join(url)

Async. Load a dat into memory, add it to the local storage (if not yet present) and begin swarming. Does not need to be called if `autoSwarm` is true.

 - **url**: String, the url of the dat. Can provide a DNS shortname.

```js
await dat.swarm.join('dat://beakerbrowser.com')
```

### swarm.leave(url)

Async. Stop swarming the given dat.

```js
await dat.swarm.leave('dat://beakerbrowser.com')
```

Will not remove the dat's data from the local storage (see `dat.storage.remove()`).

### swarm.port

Number. The port being listened to.

### swarm.networkId

A 32-byte buffer containing a randomly-generated ID, used to deduplicate connections.

### Event: "listening"

The swarm port is now bound and listening.

 - **port**. Number.

### Event: "error"

A critical error has occurred.

 - **err**. Error.

### Event: "peer"

Emitted when a peer has been discovered.

 - **peer**. Peer.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **id** String. The ID of the peer on the discovery network.
   - **channel** Buffer. The key used to arrange this connection in the discovery network.

### Event: "peer-banned"

Emitted when a peer has been banned as a connection candidate.

 - **peer**. Peer.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **id** String. The ID of the peer on the discovery network.
   - **channel** Buffer. The key used to arrange this connection in the discovery network.
 - **details**. Object.
   - **reason**. String. Why was the peer banned? May be 'application' (removePeer() was called) or 'detected-self'.

### Event: "peer-rejected"

Emitted when a peer has been rejected as a connection candidate.

 - **peer**. Peer.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **id** String. The ID of the peer on the discovery network.
   - **channel** Buffer. The key used to arrange this connection in the discovery network.
 - **details**. Object.
   - **reason**. String. Why was the peer rejected? May be 'duplicate', 'banned', or 'whitelist'.

### Event: "drop"

Emitted when a peer has been dropped from tracking, typically because it failed too many times to connect. 

 - **peer**. Peer.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **id** String. The ID of the peer on the discovery network.
   - **channel** Buffer. The key used to arrange this connection in the discovery network.

### Event: "connecting"

Emitted when a connection is being attempted.

 - **peer**. Peer.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **id** String. The ID of the peer on the discovery network.
   - **channel** Buffer. The key used to arrange this connection in the discovery network.

### Event: "connect-failed"

Emitted when a connection attempt fails.

 - **peer**. Peer.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **id** String. The ID of the peer on the discovery network.
   - **channel** Buffer. The key used to arrange this connection in the discovery network.
 - **details**. Object.
   - **timedout**. Boolean. Did the connection fail due to a timeout?

### Event: "handshaking"

Emitted when you've connected to a peer and are now initializing the connection's session.

 - **connection**. Connection.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **key** String. The key of the dat which the peer is exchanging.
   - **discoveryKey** String. The discovery key of the dat which the peer is exchanging.

### Event: "handshake-timeout"

Emitted when the handshake fails to complete in a timely fashion.

 - **connection**. Connection.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **key** String. The key of the dat which the peer is exchanging.
   - **discoveryKey** String. The discovery key of the dat which the peer is exchanging.

### Event: "connection"

Emitted when you have fully connected to another peer.

 - **connection**. Connection.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **key** String. The key of the dat which the peer is exchanging.
   - **discoveryKey** String. The discovery key of the dat which the peer is exchanging.

### Event: "connection-closed"

Emitted when you've disconnected from a peer. 

 - **connection**. Connection.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **key** String. The key of the dat which the peer is exchanging.
   - **discoveryKey** String. The discovery key of the dat which the peer is exchanging.

### Event: "redundant-connection"

Emitted when multiple connections are detected with a peer, and so one is going to be dropped (the connection given).

 - **connection**. Connection.
   - **remoteAddress** String.
   - **remotePort** Number.
   - **key** String. The key of the dat which the peer is exchanging.
   - **discoveryKey** String. The discovery key of the dat which the peer is exchanging.

## DatDNS

The DNS manager. Can be found on the [`DatNode`](#DatNode) API as `dat.dns`.

### dns.resolve(url)

Async. Get the key of the given URL.

```js
var key = await dat.dns.resolve('dat://beakerbrowser.com')
```

## DatArchive

A dat "archive" instance. See the [`DatArchive` API docs](https://beakerbrowser.com/docs/apis/dat.html).

```js
const {createNode} = require('@beaker/dat-node')

const dat = createNode()
var archive = dat.getArchive('dat://beakerbrowser.com')
await archive.readdir('/') => [...]
```
