'use strict';

// these tests use the live sdata server and thus will not work outside of the VPN,
// they can also fail due to timeouts
var SDATA_TEST_URL = 'http://vmng-slx83.sssworld-local.com:3001/sdata/slx/dynamic/-/';
var expect = require('chai').expect;
var sdataProvider = require('../index');
var sdata = sdataProvider(SDATA_TEST_URL, 'admin', '');

describe('sdata service - tests using actual SData server', function() {
  this.timeout(7500);

  it('should retrieve accounts', function(done) {
    sdata.read('accounts', 'AccountName like \'A%\'', { select: 'AccountName,Address/City' }, function(error, data) {
      expect(error).to.not.be.ok;
      expect(data).to.be.ok;
      expect(data).to.have.property('$totalResults');
      expect(data.$resources[0]).to.have.property('AccountName');
      expect(data.$resources[0]).to.not.have.property('Type');
      expect(data.$resources[0].Address).to.have.property('City');
      done();
    });
  });
  it('should retrieve multiple pages of accounts', function(done) {
    const result = sdata.readPaged('accounts', 'AccountName like \'A%\'', {
      select: 'AccountName,Address/City', count: 10
    })
    let readCount = 0
    result.on('data', rec => {
      readCount++
      if(readCount === 20)
        done()
    })
    result.on('end', () => {
      done('we should have read more records')
    })
  })
  it('emits an error on the stream, if there is an sdata error', function(done) {
    var sdata2 = sdataProvider('http://invaliddomainnameXXXX.com');
    const result = sdata2.readPaged('accounts', 'AccountName like \'A%\'', {
      select: 'AccountName,Address/City', count: 10
    })
    let hasError = false
    result.on('error', err => {
      hasError = true
    })
    result.on('end', () => {
      expect(hasError).to.be.true
      done()
    })
    result.on('data', () => {
      done('there should be no data')
    })
  })
  it('should return error when querying an unavailable site', function(done) {
    var sdata2 = sdataProvider('http://invaliddomainnameXXXX.com');
    sdata2.read('accounts', 'AccountName like \'\'', function(error, data) {
      expect(error).to.be.ok;
      done();
    });
  });
  it('should return error when authentication is not valid', function(done) {
    var sdata = sdataProvider(SDATA_TEST_URL);
    sdata.read('accounts', 'AccountName like \'\'', function(error, data) {
      expect(error).to.be.ok;
      expect(error.statusCode).to.equal(401);
      done();
    });
  });
  it('should create accounts', function(done) {
    var acc = {
      AccountName: 'Foo'
    };
    sdata.create('accounts', acc, function(error, data) {
      expect(error).to.not.be.ok;
      expect(data).to.be.ok;
      expect(data).to.have.property('$key');
      sdata.delete('accounts', data.$key);
      done();
    });
  });
  it('should create accounts, using promise', function(done) {
    var acc = {
      AccountName: 'Foo'
    };
    sdata.create('accounts', acc).then(function(data) {
      expect(data).to.be.ok;
      expect(data).to.have.property('$key');
      sdata.delete('accounts', data.$key);
      done();
    });
  })
  it('should update accounts', function(done) {
    var acc = {
      AccountName: 'Foo'
    };
    sdata.create('accounts', acc, function(error, data) {
      sdata.update('accounts', {
        '$key': data.$key,
        AccountName: 'Foo++'
      }, function(error, data) {
        expect(error).to.not.be.ok;
        expect(data.AccountName).to.equal('Foo++');
        sdata.delete('accounts', data.$key);  // cleanup
        done();
      });
    });
  });
  it('should create accounts using upsert', function(done) {
    var acc = {
      AccountName: 'Foo'
    };
    sdata.upsert('accounts', acc, function(error, data) {
      expect(error).to.not.be.ok;
      expect(data.$key).to.be.ok;
      sdata.delete('accounts', data.$key); // cleanup
      done();
    });
  });
  it('should delete accounts', function(done) {
    var acc = {
      AccountName: 'Foo'
    };
    sdata.create('accounts', acc, function(error, data) {
      sdata.delete('accounts', data.$key, function(error, data) {
        expect(error).to.not.be.ok;
        expect(data).to.be.undefined;
        done();
      });
    });
  });
  it('should call a business rule', function(done) {
    var acc = {
      AccountName: 'Foo'
    };
    sdata.create('accounts', acc, function(error, data) {
      expect(error).to.not.be.ok;
      sdata.callBusinessRule('accounts', 'CanChangeOwner', data.$key, null, function(error, data) {
        expect(error).to.not.be.ok;
        expect(data.Result).to.be.true;
        sdata.delete('accounts', data.$key); // cleanup
        done();
      });
    });
  });
});
