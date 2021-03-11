const util = require('util')
const debug = require('debug')('sdata:errors')
const SDataError = require('./SDataError')

// try to extract the SData error from a message
module.exports = function convertSDataError({ error, response }, url) {
  if (url) {
    debug(`Error from SData reading URL ${url}`, error)
  } else {
    debug('Error from SData', error)
  }
  if (util.isArray(error)) {
    return new SDataError(error[0])
  } else if (response && response.statusCode === 401) {
    return new Error('Authentication failed')
  } else {
    return new Error((error && error.message) || 'Unknown SData error')
  }
}
