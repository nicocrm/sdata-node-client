function SDataError(err) {
  let msg = err.message
  if (/^We're sorry, you've encountered an error/.test(msg)) {
    msg +=
      ' (this is a generic SData error and may indicate corrupted memory.  Check server event log and restart application pool if applicable)'
  }
  this.message = msg
  this.severity = err.severity
  this.sdataCode = err.sdataCode
  this.stackTrace = err.stackTrace
  this.applicationCode = err.applicationCode
  this.payloadPath = err.payloadPath
}
SDataError.prototype.toString = function () {
  return 'SData Error: ' + this.message + ' (' + this.sdataCode + ')'
}
module.exports = SDataError
