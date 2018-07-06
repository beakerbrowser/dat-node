const datEncoding = require('dat-encoding')
const parseDatURL = require('parse-dat-url')
const {TimeoutError} = require('beaker-error-constants')
const EventTarget = require('dom-event-target')
const getFolderSize = require('get-folder-size')
const execFile = require('child_process').execFile
const {BadArgumentError, InvalidTypeError} = require('./const')
const {promisify} = require('util')

exports.timer = function (ms, fn) {
  var currentAction
  var isTimedOut = false

  // no timeout?
  if (!ms) return fn(() => false)

  return new Promise((resolve, reject) => {
    // start the timer
    const timer = setTimeout(() => {
      isTimedOut = true
      reject(new TimeoutError(currentAction ? `Timed out while ${currentAction}` : undefined))
    }, ms)

    // call the fn to get the promise
    var promise = fn(action => {
      if (action) currentAction = action
      return isTimedOut
    })

    // wrap the promise
    promise.then(
      val => {
        clearTimeout(timer)
        resolve(val)
      },
      err => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

exports.promisifyObject = function (obj) {
  for (var k in obj) {
    if (typeof obj[k] === 'function') {
      obj[k] = promisify(obj[k].bind(obj))
    }
  }
  return obj
}

exports.toEventTarget = function (es) {
  var target = new EventTarget()
  es.on('data', ([event, args]) => target.send(event, args))
  target.close = es.destroy.bind(es)
  return target
}

exports.toKey = function (str) {
  str = (typeof str === 'object' && str.url) ? str.url : str
  str = (typeof str === 'object' && str.key) ? str.key : str
  return parseDatURL(datEncoding.toStr(str)).host
}

exports.hasParam = function (v, param) {
  if (typeof v === 'undefined') {
    throw new BadArgumentError(`Missing argument ${param}`)
  }
}

exports.paramHasType = function (v, type, param) {
  if (typeof v !== type) {
    throw new InvalidTypeError(`${param} should be a type, got ${typeof v}`)
  }
}

exports.du = function (path) {
  return new Promise(resolve => {
    execFile('du', ['-s', path], (_, stdout, stderr) => {
      const size = +(stdout.split('\t')[0])
      if (isNaN(size)) {
        getFolderSize(path, (_, size) => {
          resolve(size)
        })
      } else {
        resolve(size * 1024) // multiply by 1024 because du gives kB and we want B
      }
    })
  })
}

exports.log = function (daemon, ...args) {
  // TODO
  // console.log('LOG', ...args)
}
