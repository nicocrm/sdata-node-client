/*jslint node: true*/

'use strict';

var requestBase = require('request-promise-native'),
  util = require('util'),
  FindStream = require('./lib/FindStream'),
  convertSDataError = require('./lib/convertSDataError'),
  debug = require('debug')('sdata')

function SDataService(sdataUri, username, password) {
  var _request = requestBase;
  var service = {
    setAuthenticationParameters: function (newUsername, newPassword) {
      _request = _request.defaults({
        auth: {
          'user': newUsername,
          'pass': newPassword
        },
        headers: {
          'Content-Type': 'application/json'
        },
        json: true,
        resolveWithFullResponse: true
      });
    },

    read: function (resourceKind, where, queryArgs, callback) {
      // summary:
      //  Retrieve SData resources matching the specified criteria
      // parameters:
      //  resourceKind
      //  where
      //  queryArgs (optional) object with properties to be added to the request (e.g. {select: 'AccountName'})
      //  callback: function(error, data):
      //     - if the call is successful, will be called with data
      //     - if there is an error, will be called with an error object with the properties:
      //                 message: description of the error (first error message returned from sdata if available)
      //                 errors: populated with errors returned from sdata, if any
      //                 statusCode: http status code, if available
      // returns:
      //  Promise

      var url = sdataUri + resourceKind + '?format=json'
      if (where && !(queryArgs && 'where' in queryArgs)) {
        // this must be encoded explicitly because Angular will encode a space to a + (conforming to RFC)
        // which sdata cannot parse
        url += '&where=' + encodeURIComponent(where)
      }
      if (queryArgs) {
        if (typeof (queryArgs) == 'function' && !callback) {
          callback = queryArgs;
        } else {
          for (var k in queryArgs) {
            if (queryArgs.hasOwnProperty(k))
              url += '&' + k + '=' + encodeURIComponent(queryArgs[k]);
          }
        }
      }

      return handleSdataResponse(_request.get(url), 200, callback)
    },

    readPaged: function(resourceKind, where, queryArgs) {
      // summary:
      //  Retrieve SData resources matching the specified criteria, and automatically
      //  requests multiple pages of data
      // parameters:
      //  resourceKind
      //  where
      //  queryArgs (optional) object with properties to be added to the request (e.g. {select: 'AccountName'})
      // returns:
      //  stream of records
      let url = sdataUri + resourceKind + '?format=json'
      if (where && !(queryArgs && 'where' in queryArgs)) {
        url += '&where=' + encodeURIComponent(where);
      }
      if (queryArgs) {
        Object.keys(queryArgs).forEach(k => {
          url += '&' + k + '=' + encodeURIComponent(queryArgs[k]);
        })
      }
      debug('readPaged: using URL: ' + url)
      return new FindStream(_request, url)
    },

    create: function (resourceKind, data, callback) {
      // summary:
      //  Create resource
      // parameters:
      //  resourceKind: string (e.g. accounts)
      //  data: object (content of the record to create)
      //  callback: function(data,error): handler for returned data (see callback documentation under read)
      var url = sdataUri + resourceKind + '?format=json';
      return handleSdataResponse(_request({
        method: 'POST',
        uri: url,
        body: data
      }), 201, callback);
    },

    update: function (resourceKind, data, callback) {
      // summary:
      //  Update designated resource.  The id ($key) must be provided as part of the data.
      var url = sdataUri + resourceKind + '("' + data.$key + '")?format=json';
      return handleSdataResponse(_request({
        method: 'PUT',
        uri: url,
        body: data
      }), 200, callback);
    },

    upsert: function(resourceKind, data, callback) {
      // summary:
      //  Convenience method combining insert + update.
      //  If the data has a $key property, update will be called, otherwise insert.
      (data.$key ? service.update : service.create)(resourceKind, data, callback);
    },

    delete: function (resourceKind, key, callback) {
      // summary:
      //  delete designated resource.
      // Note that when invoked successfully the callback will not be passed any data.
      var url = sdataUri + resourceKind + '("' + key + '")?format=json';
      return handleSdataResponse(_request({
        method: 'DELETE',
        uri: url
      }), 200, callback);
    },

    callBusinessRule: function (resourceKind, operationName, recordId, parameters, callback) {
      var payload = {
        $name: operationName,
        request: {
          entity: {
            $key: recordId
          }
        }
      };
      if (parameters){
        util._extend(payload.request, parameters);
      }
      var url = sdataUri + resourceKind + '/$service/' + operationName + '?format=json';
      var p = handleSdataResponse(_request({
        method: 'POST',
        uri: url,
        body: payload
      }), 200)
        .then(function(body) {
          // get the inside response, for business rule calls
          return body.response ? body.response : body
        })
      if(callback) {
        p = p.then(function(r) { callback(null, r) }, callback)
      }
      return p;
    }
  };

  if (username)
    service.setAuthenticationParameters(username, password);

  return service;

  ///////////////

  function handleSdataResponse(requestPromise, expectedStatusCode, callback) {
    var p = requestPromise.then(function(response) {
      var body = response.body
      if(response.statusCode !== expectedStatusCode) {
        return Promise.reject(convertSDataError({response}))
      } else {
        return body
      }
    }, function(err) {
      return Promise.reject(convertSDataError(err))
    })
    if(callback) {
      p = p.then(function(body) {
        callback(null, body)
      }, function(error) {
        callback(error)
      })
    }
    return p
  }
}

module.exports = SDataService;
