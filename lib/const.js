// urls
exports.DAT_HASH_REGEX = /^[0-9a-f]{64}$/i

// url file paths
exports.DAT_VALID_PATH_REGEX = /^[a-z0-9-._~!$&'()*+,;=:@/\s]+$/i

// dat settings
exports.DAT_MANIFEST_FILENAME = 'dat.json'
exports.DEFAULT_DAT_API_TIMEOUT = 5e3

// dat.json manifest fields which can be changed by configure()
exports.DAT_CONFIGURABLE_FIELDS = [
  'title',
  'description',
  'type',
  'links',
  'web_root',
  'fallback_page'
]

// dat.json manifest fields which should be preserved in forks
exports.DAT_PRESERVED_FIELDS_ON_FORK = [
  'web_root',
  'fallback_page',
  'links'
]

// errors
exports.BadArgumentError = class BadArgumentError extends Error {
  constructor (msg) {
    super()
    this.message = msg
    this.badArgument = true
  }
}

exports.InvalidTypeError = class InvalidTypeError extends Error {
  constructor (msg) {
    super()
    this.message = msg
    this.invalidType = true
  }
}
