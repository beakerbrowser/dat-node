import test from 'ava'
import os from 'os'
import path from 'path'
import fs from 'fs'

import {createNode} from '..'

const app1 = createNode({
  path: fs.mkdtempSync(os.tmpdir() + path.sep + 'dat-node-test-')
})

const app2 = createNode({
  path: fs.mkdtempSync(os.tmpdir() + path.sep + 'dat-node-test-')
})

var createdDatUrl
var datPeers1
var datPeers2

test.before(async t => {
  const res = await app1.createArchive({ title: 'Test Archive', description: 'Foo', prompt: false })

  createdDatUrl = res.url

  datPeers1 = await app1.getPeers(createdDatUrl)
  datPeers2 = await app2.getPeers(createdDatUrl)
})
test.after.always('cleanup', async t => {
  datPeers1._detach()
  datPeers2._detach()
})

// tests
//

test('datPeers.list() and datPeers.get()', async t => {
  // list peers in browser 1
  var peers1 = await datPeers1.list()
  t.is(peers1.length, 1)
  t.is(typeof peers1[0].id, 'string')
  t.is(typeof peers1[0].userData, 'undefined')
  t.is(typeof peers1[0].send, 'function')

  // list peers in browser 2
  var peers2 = await datPeers2.list()
  t.is(peers2.length, 1)
  t.is(typeof peers2[0].id, 'string')
  t.is(typeof peers2[0].userData, 'undefined')
  t.is(typeof peers2[0].send, 'function')

  // get peer in browser 1
  var peer1 = await datPeers1.get(peers1[0].id)
  t.is(peer1.id, peers1[0].id)
  t.is(typeof peer1.userData, 'undefined')
  t.is(typeof peer1.send, 'function')

  // get peer in browser 2
  var peer2 = await datPeers2.get(peers2[0].id)
  t.is(peer2.id, peers2[0].id)
  t.is(typeof peer2.userData, 'undefined')
  t.is(typeof peer2.send, 'function')
})

test('datPeers.broadcast() and datPeers.send()', async t => {
  const broadcastCode = async (datPeers, value) => {
    await datPeers.broadcast({foo: value})
    await datPeers.broadcast(value)
  }

  const sendCode = async (datPeers, value) => {
    var peers = await datPeers.list()
    await peers[0].send({foo: value})
    await peers[0].send(value)
  }

  const messages1 = []
  const messages2 = []

  // setup listeners
  datPeers1.addEventListener('message', e => {
    messages1.push(e.message)
  })
  datPeers2.addEventListener('message', e => {
    messages2.push(e.message)
  })

  // broadcast and send
  await broadcastCode(datPeers1, 'left')
  await broadcastCode(datPeers2, 'right')
  await sendCode(datPeers1, 'left')
  await sendCode(datPeers2, 'right')

  // check messages
  t.deepEqual(messages2, [
    { foo: "left" },
    "left",
    { foo: "left" },
    "left"
  ])
  t.deepEqual(messages1, [
    { foo: "right" },
    "right",
    { foo: "right" },
    "right"
  ])
})

test('datPeers.setSessionData() and datPeers.getSessionData()', async t => {
  const getOtherSessionDataCode = async (datPeers) => {
    var peers = await datPeers.list()
    return peers[0].sessionData
  }

  var sessionDatas1 = []
  var sessionDatas2 = []

  // setup listeners
  datPeers1.addEventListener('session-data', e => {
    sessionDatas1.push(e.peer.sessionData)
  })
  datPeers2.addEventListener('session-data', e => {
    sessionDatas2.push(e.peer.sessionData)
  })

  // check local session datas
  t.is(await datPeers1.getSessionData(), null)
  t.is(await datPeers2.getSessionData(), null)

  // set session datas
  await datPeers1.setSessionData({ foo: 'left' })
  await datPeers2.setSessionData({ foo: 'right' })

  // check local session datas
  t.deepEqual(await datPeers1.getSessionData(), { foo: 'left' })
  t.deepEqual(await datPeers2.getSessionData(), { foo: 'right' })

  // check other session datas
  t.deepEqual(sessionDatas1, { foo: 'right' })
  t.deepEqual(sessionDatas2, { foo: 'left' })

  // set session datas
  await datPeers1.setSessionData('left')
  await datPeers2.setSessionData('right')

  // check local session datas
  t.deepEqual(await datPeers1.getSessionData(), 'left')
  t.deepEqual(await datPeers2.getSessionData(), 'right')

  // check other session datas
  t.deepEqual(await getOtherSessionDataCode(datPeers1), 'right')
  t.deepEqual(await getOtherSessionDataCode(datPeers2), 'left')

  // check events
  sessionDatas1 = removeDuplicates(sessionDatas1) // the event can fire multiple times due to disconnects, so remove dups
  sessionDatas2 = removeDuplicates(sessionDatas2) // the event can fire multiple times due to disconnects, so remove dups
  t.deepEqual(sessionDatas1, [
    { foo: "right" },
    "right"
  ])
  t.deepEqual(sessionDatas2, [
    { foo: "left" },
    "left"
  ])
})

function removeDuplicates(arr) {
  var s = new Set(arr.map(v => JSON.stringify(v)))
  return [...s].map(v => JSON.parse(v))
}