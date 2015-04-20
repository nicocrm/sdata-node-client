SData client library for Node.js
================================

Overview
--------

Very simple library facilitating SData calls from a node app.

Example usage
-------------

### Reading a resource

    var sdataProvider = require('sdata-client');
    var sdata = sdataProvider('http://localhost/sdata/slx/dynamic/-/', 'admin', '');
    sdata.read('accounts', 'AccountName like \'A%\'', function(data, error) {

    });
    
    sdata.read('accounts', 'AccountName like \'A%\'', { include: 'Address,Contacts' }, function(data, error) {

    });

### Passing username / password

#### At construction time

    var sdataProvider = require('sdata-client');
    var sdata = sdataProvider('http://localhost/sdata/slx/dynamic/-/', 'admin', '');
    
#### After the fact    

    var sdata = require('sdata-client')(url);
    sdata.setAuthenticationParameters('admin', '');

### Error handling

    var sdata = require('sdata-client')(url, 'admin', '');
    sdata.read('accounts', 'SomeInvalidQueryParam eq \'\'', function(data, error) {
        console.warn('SDATA ERROR: ' + error.message);
    });