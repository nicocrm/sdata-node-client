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
  it('should use where property from queryArgs if present', function(done) {
    sdata.read('accounts', '', { where: 'AccountName like "A%"', select: 'AccountName,Address/City' }, function(error, data) {
      expect(error).to.not.be.ok;
      expect(data).to.be.ok;
      data.$resources.forEach(acc => expect(acc.AccountName).to.match(/^A/))
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
  it('should retrieve multiple pages of accounts, with limit', function(done) {
    const result = sdata.readPaged('accounts', 'AccountName like \'A%\'', {
      select: 'AccountName,Address/City', count: 10
    }, 20)
    let readCount = 0
    result.on('data', rec => {
      readCount++
    })
    result.on('end', () => {
      expect(readCount).to.equal(20)
      done()
    })
  })
  it('emits an error on the stream, if there is an sdata error', function(done) {
    var sdata2 = sdataProvider('http://invaliddomainnameXXXX.com');
    const result = sdata2.readPaged('accounts', 'AccountName like \'A%\'', {
      select: 'AccountName,Address/City', count: 10
    })
    let hasError = false
    result.on('error', err => {
      hasError = err
    })
    result.on('end', () => {
      expect(hasError).to.be.ok
      expect(hasError).to.be.an('error')
      expect(hasError).to.match(/invaliddom/)
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
      expect(error).to.be.a('error')
      expect(error).to.match(/invaliddom/)
      done();
    });
  });
  it('should return error message when given an invalid query', function() {
    return sdata.read('accounts', 'XXXXX like \'\'')
      .then(function(m) {
        throw new Error('should not pass!')
      }, function(e) {
        expect(e).to.be.a('error')
        expect(e).to.match(/could not resolve property/)
      })
  })
  it('should return error when authentication is not valid', function(done) {
    var sdata = sdataProvider(SDATA_TEST_URL);
    sdata.read('accounts', 'AccountName like \'\'', function(error, data) {
      expect(error).to.be.ok;
      expect(error).to.match(/Authentication failed/i)
      done();
    });
  });
  it('get() should return an error if the record does not exist', function(done) {
    sdata.get('accounts', 'XXXX', function(error, data) {
      expect(error).to.be.ok
      expect(error).to.match(/not found/i)
      done()
    })
  })
  it('get() should read a single record', function() {
    return sdata.read('accounts').then(function(result) {
      return sdata.get('accounts', result.$resources[0].$key).then(function(acc) {
        expect(acc).to.be.ok.and.to.have.property('AccountName')
      })
    })
  })

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
