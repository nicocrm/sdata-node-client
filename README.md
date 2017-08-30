SData client library for Node.js
================================

Overview
--------

Very simple library facilitating SData calls from a node app.

Installing
----------

npm install sdata-client

Example usage
-------------

### Reading a resource

```
    var sdataProvider = require('sdata-client');
    var sdata = sdataProvider('http://localhost/sdata/slx/dynamic/-/', 'admin', '');
    sdata.read('accounts', 'AccountName like \'A%\'', function(error, data) {
      // retrieve accounts from data.$resources
      // other sdata fields are available in data
    });

    // can pass additional parameters for the query
    sdata.read('accounts', 'AccountName like \'A%\'', { include: 'Address,Contacts' }, function(error, data) {

    });
```

For new development, promise-style invocation is preferred (see below)

Note that if you pass both a where string and a `where` key in the query args, the one from the query args will take precedence.

### Updating

```
    var sdata = require('sdata-client')(url, 'admin', '');
    sdata.update('accounts', { '$key': 'Axxxxxxx', AccountName: 'Foo' }, function(error, data) { ... });
    sdata.create('accounts', { AccountName: 'Foo' }, function(error, data) { ... });
    // this one will call create if the $key is missing, update otherwise
    sdata.upsert('accounts', { '$key': 'Axxxxxxx', AccountName: 'Foo' }, function(error, data) { ... });
    sdata.delete('accounts', 'Axxxxxxx', function(error) { ... } );
```

### Passing username / password

#### At construction time

```
    var sdataProvider = require('sdata-client');
    var sdata = sdataProvider('http://localhost/sdata/slx/dynamic/-/', 'admin', '');
```

#### After the fact

```
    var sdata = require('sdata-client')(url);
    sdata.setAuthenticationParameters('admin', '');
```

### Error handling

```
    var sdata = require('sdata-client')(url, 'admin', '');
    sdata.read('accounts', 'SomeInvalidQueryParam eq \'\'', function(error, data) {
        if(error)
            console.warn('SDATA ERROR: ' + error.message);
    });
```

Usage with promises
-------------------

When a callback is not provided to the sdata method, it will return a promise instead (this is preferred as otherwise the callback will execute in a then block and exceptions thrown from it may not be properly handled)
