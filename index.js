/*jslint node: true*/

'use strict';

var requestBase = require('request'),
    jsonic = require('jsonic'),
    util = require('util');

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
                json: true
            });
        },

        read: function (resourceKind, where, queryArgs, callback) {
            // summary:
            //  Retrieve SData resources matching the specified criteria
            // parameters:
            //  resourceKind
            //  where
            //  queryArgs (optional) object with properties to be added to the request (e.g. {select: 'AccountName'})
            //  callback: function(data,error):
            //     - if the call is successful, will be called with data
            //     - if there is an error, will be called with an error object with the properties:
            //                 message: description of the error (first error message returned from sdata if available)
            //                 errors: populated with errors returned from sdata, if any
            //                 statusCode: http status code, if available

            var url = sdataUri + resourceKind + '?format=json';
            if (where) {
                // this must be encoded explicitly because Angular will encode a space to a + (conforming to RFC)
                // which sdata cannot parse
                url += '&where=' + encodeURIComponent(where);
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

            _request.get(url, handleSdataResponse(200, callback));
        },

        create: function (resourceKind, data, callback) {
            // summary:
            //  Create resource
            // parameters:
            //  resourceKind: string (e.g. accounts)
            //  data: object (content of the record to create)
            //  callback: function(data,error): handler for returned data (see callback documentation under read)
            var url = sdataUri + resourceKind + '?format=json';
            _request({
                method: 'POST',
                uri: url,
                body: data
            }, handleSdataResponse(201, callback));
        },

        update: function (resourceKind, data, callback) {
            // summary:
            //  Update designated resource.  The id ($key) must be provided as part of the data.
            var url = sdataUri + resourceKind + '("' + data.$key + '")?format=json';
            _request({
                method: 'PUT',
                uri: url,
                body: data
            }, handleSdataResponse(200, callback));            
        },

        destroy: function (resourceKind, key, callback) {
            // summary:
            //  delete designated resource.
            // Note that when invoked successfully the callback will not be passed any data.
            var url = sdataUri + resourceKind + '("' + key + '")?format=json';
            _request({
                method: 'DELETE',
                uri: url                
            }, handleSdataResponse(200, callback));
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
            _request({
                method: 'POST',
                uri: url,
                body: payload
            }, handleSdataResponse(200, callback));            
        }
    };

    if (username)
        service.setAuthenticationParameters(username, password);

    return service;

    ///////////////

    function handleSdataResponse(expectedStatusCode, callback) {
        return function (e, r, body) {
            if (!e && r.statusCode == expectedStatusCode) {
                callback(body);
            } else {
                var error;
                if(!r)
                    error = { message: 'Unable to connect: ' + e }
                else if(r.statusCode == 401)
                    error = { message: 'Authentication failed' }
                else if(body && util.isArray(body)) 
                    error = { message: body[0].message, errors: body };
                else 
                    error = { message: 'Unknown sdata error' };
                if(r) {
                    error.statusCode = r.statusCode;
                }
                
                callback(null, error);
            }
        }
    }
}

module.exports = SDataService;