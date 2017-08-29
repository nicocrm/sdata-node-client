const util = require('util')
const debug = require('debug')('sdata')

// try to extract the SData error from a message
module.exports = function convertSDataError({error, response}) {
  debug('Error from SData', error)
  if(util.isArray(error)) {
    return new Error(error[0].message)
  } else if(response && response.statusCode === 401) {
    return new Error('Authentication failed')
  } else {
    return new Error((error && error.message) || 'Unknown SData error')
  }
}
