// Shamelessly grabbed from https://github.com/beakerbrowser/beaker-core/blob/73c76cc990494b73942452c7244271e3f6d76171/web-apis/bg/experimental/dat-peers.js
const EventEmitter = require('events')
const emitStream = require('emit-stream')
const { DatSessionDataExtMsg } = require('@beaker/dat-session-data-ext-msg')
const { DatEphemeralExtMsg } = require('@beaker/dat-ephemeral-ext-msg')
const EventTarget = require('dom-event-target')

class DatPeers extends EventTarget {
	constructor(archive) {
		super()

		this._dataStructure = archive._dataStructure

		attach(this._dataStructure)

		const events = this._dataStructure._datPeersEvents

		events.on('connect', (event) => {
			this.send('connect', {
				peer: this._get(event.peerId, event.sessionData)
			})
		})
		events.on('disconnect', (event) => {
			this.send('disconnect', {
				peer: this._get(event.peerId, event.sessionData)
			})
		})
		events.on('message', (event) => {
			this.send('message', {
				peer: this._get(event.peerId, event.sessionData),
				message: event.message
			})
		})
		events.on('session-data', (event) => {
			this.send('session-data', {
				peer: this._get(event.peerId, event.sessionData)
			})
		})
	}

	_detach() {
		return detach(this._dataStructure)
	}

	async getSessionData() {
		return getSessionData(this._dataStructure)
	}

	async setSessionData(data) {
		return setSessionData(this._dataStructure, data)
	}

	async list() {
		const rawList = await listPeers(this._dataStructure)

		return rawList.map(({id, sessionData}) => this._get(id, sessionData))
	}

	_get(id, sessionData) {
		return new DatPeer(this._dataStructure, sessionData, id)
	}

	async get(id) {
		const sessionData = await getPeerSessionData(this._dataStructure, id)
		return this._get(id, sessionData);
	}

	async broadcast(message) {
		return broadcastEphemeralMessage(this._dataStructure, message)
	}
}

class DatPeer {
	constructor(archive, sessionData, id) {
		this.id = id
		this._archive = archive
		this.sessionData = sessionData

		// TODO: Listen on changes in session data
	}

	async send(message) {
		return sendEphemeralMessage(this.id, this._archive, message)
	}
}

exports.DatPeers = DatPeers

// globals
// =

var datSessionDataExtMsg = new DatSessionDataExtMsg()
var datEphemeralExtMsg = new DatEphemeralExtMsg()

// exported api
// =

function setup() {
	datEphemeralExtMsg.on('message', onEphemeralMsg)
	datSessionDataExtMsg.on('session-data', onSessionDataMsg)
}
exports.setup = setup

// call this on every archive created in the library
function attach(archive) {
	datEphemeralExtMsg.watchDat(archive)
	datSessionDataExtMsg.watchDat(archive)
	archive._datPeersEvents = new EventEmitter()
	archive._datPeersOnPeerAdd = (peer) => onPeerAdd(archive, peer)
	archive._datPeersOnPeerRemove = (peer) => onPeerRemove(archive, peer)
	archive.metadata.on('peer-add', archive._datPeersOnPeerAdd)
	archive.metadata.on('peer-remove', archive._datPeersOnPeerRemove)
}

// call this on every archive destroyed in the library
function detach(archive) {
	datEphemeralExtMsg.unwatchDat(archive)
	datSessionDataExtMsg.unwatchDat(archive)
	delete archive._datPeersEvents
	archive.metadata.removeListener('peer-add', archive._datPeersOnPeerAdd)
	archive.metadata.removeListener('peer-remove', archive._datPeersOnPeerRemove)
}

// impl for datPeers.list()
function listPeers(archive) {
	return archive.metadata.peers.map(internalPeerObj => createWebAPIPeerObj(archive, internalPeerObj))
}

// impl for datPeers.getPeer(peerId)
function getPeer(archive, peerId) {
	var internalPeerObj = archive.metadata.peers.find(internalPeerObj => getPeerId(internalPeerObj) === peerId)
	return createWebAPIPeerObj(archive, internalPeerObj)
}

// impl for datPeers.broadcast(msg)
function broadcastEphemeralMessage(archive, payload) {
	datEphemeralExtMsg.broadcast(archive, encodeEphemeralMsg(payload))
}

// impl for datPeers.send(peerId, msg)
function sendEphemeralMessage(archive, peerId, payload) {
	datEphemeralExtMsg.send(archive, peerId, encodeEphemeralMsg(payload))
}

// impl for datPeers.getSessionData()
function getSessionData(archive) {
	return decodeSessionData(datSessionDataExtMsg.getLocalSessionData(archive))
}

// impl for datPeers.getSessionData(data)
function setSessionData(archive, sessionData) {
	return datSessionDataExtMsg.setLocalSessionData(archive, encodeSessionData(sessionData))
}

function createDatPeersStream(archive) {
	return emitStream(archive._datPeersEvents)
}

// events
// =

function onPeerAdd(archive, internalPeerObj) {
	if (getPeerId(internalPeerObj)) onHandshook()
	else internalPeerObj.stream.stream.on('handshake', onHandshook)

	function onHandshook() {
		var peerId = getPeerId(internalPeerObj)

		// send session data
		if (datSessionDataExtMsg.getLocalSessionData(archive)) {
			datSessionDataExtMsg.sendLocalSessionData(archive, peerId)
		}

		// emit event
		archive._datPeersEvents.emit('connect', {
			peerId,
			sessionData: getPeerSessionData(archive, peerId)
		})
	}
}

function onPeerRemove(archive, internalPeerObj) {
	var peerId = getPeerId(internalPeerObj)
	if (peerId) {
		archive._datPeersEvents.emit('disconnect', {
			peerId,
			sessionData: getPeerSessionData(archive, peerId)
		})
	}
}

function onEphemeralMsg(archive, internalPeerObj, msg) {
	var peerId = getPeerId(internalPeerObj)
	archive._datPeersEvents.emit('message', {
		peerId,
		sessionData: getPeerSessionData(archive, peerId),
		message: decodeEphemeralMsg(msg)
	})
}

function onSessionDataMsg(archive, internalPeerObj, sessionData) {
	archive._datPeersEvents.emit('session-data', {
		peerId: getPeerId(internalPeerObj),
		sessionData: decodeSessionData(sessionData)
	})
}

// internal methods
// =

function getPeerId(internalPeerObj) {
	var feedStream = internalPeerObj.stream
	var protocolStream = feedStream.stream
	return protocolStream.remoteId ? protocolStream.remoteId.toString('hex') : null
}

function getPeerSessionData(archive, peerId) {
	return decodeSessionData(datSessionDataExtMsg.getSessionData(archive, peerId))
}

function createWebAPIPeerObj(archive, internalPeerObj) {
	var id = getPeerId(internalPeerObj)
	var sessionData = getPeerSessionData(archive, id)
	return { id, sessionData }
}

function encodeEphemeralMsg(payload) {
	var contentType
	if (Buffer.isBuffer(payload)) {
		contentType = 'application/octet-stream'
	} else {
		contentType = 'application/json'
		payload = Buffer.from(JSON.stringify(payload), 'utf8')
	}
	return { contentType, payload }
}

function decodeEphemeralMsg(msg) {
	var payload
	if (msg.contentType === 'application/json') {
		try {
			payload = JSON.parse(msg.payload.toString('utf8'))
		} catch (e) {
			console.error('Failed to parse ephemeral message', e, msg)
			payload = null
		}
	}
	return payload
}

function encodeSessionData(obj) {
	return Buffer.from(JSON.stringify(obj), 'utf8')
}

function decodeSessionData(sessionData) {
	if (!sessionData || sessionData.length === 0) return null
	try {
		return JSON.parse(sessionData.toString('utf8'))
	} catch (e) {
		console.error('Failed to parse local session data', e, sessionData)
		return null
	}
}