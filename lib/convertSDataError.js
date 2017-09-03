const util = require('util')
const debug = require('debug')('sdata')

// try to extract the SData error from a message
module.exports = function convertSDataError({error, response}, url) {
  if(url) {
    debug(`Error from SData reading URL ${url}`, error)
  } else {
    debug('Error from SData', error)
  }
  if(util.isArray(error)) {
    let msg = error[0].message
    if(/^We're sorry, you've encountered an error/.test(msg)) {
      msg += " (this is a generic SData error and may indicate corrupted memory.  Check server event log and restart application pool if applicable)"
    }
    return new Error(msg)
  } else if(response && response.statusCode === 401) {
    return new Error('Authentication failed')
  } else {
    return new Error((error && error.message) || 'Unknown SData error')
  }
}
