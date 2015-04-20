'use strict';

var SDATA_TEST_URL = 'http://vmng-slx81.sssworld-local.com:3012/sdata/slx/dynamic/-/';
var expect = require('chai').expect;
var sdataProvider = require('../index');
var sdata = sdataProvider(SDATA_TEST_URL, 'admin', '');

describe('sdata service - tests using actual SData server', function() {
    this.timeout(5000);
    
    it('should retrieve accounts', function(done) {
        sdata.read('accounts', 'AccountName like \'A%\'', { select: 'AccountName,Address/City' }, function(data, error) {
            expect(error).to.not.be.ok;
            expect(data).to.be.ok;
            expect(data).to.have.property('$totalResults');
            expect(data.$resources[0]).to.have.property('AccountName');
            expect(data.$resources[0]).to.not.have.property('Type');
            expect(data.$resources[0].Address).to.have.property('City');
            done();
        });
    });
    it('should return error when querying an unavailable site', function(done) {
        var sdata2 = sdataProvider('http://invaliddomainnameXXXX.com');
        sdata2.read('accounts', 'AccountName like \'\'', function(data, error) {
            expect(error).to.be.ok;
            done();
        });
    });
    it('should return error when authentication is not valid', function(done) {
        var sdata = sdataProvider(SDATA_TEST_URL);
        sdata.read('accounts', 'AccountName like \'\'', function(data, error) {
            expect(error).to.be.ok;
            expect(error.statusCode).to.equal(401);
            done();
        });
    });
    it('should create accounts', function(done) {
        var acc = {
            AccountName: 'Foo'
        };
        sdata.create('accounts', acc, function(data, error) {
            expect(error).to.not.be.ok;
            expect(data).to.be.ok;
            expect(data).to.have.property('$key');
            done();
        });
    });
    it('should update accounts', function(done) {
        var acc = {
            AccountName: 'Foo'
        };
        sdata.create('accounts', acc, function(data, error) {
            sdata.update('accounts', {
                '$key': data.$key,
                AccountName: 'Foo++'
            }, function(data, error) {
                expect(error).to.not.be.ok;
                expect(data.AccountName).to.equal('Foo++');                
                done();
            });
        });
    });    
    it('should delete accounts', function(done) {
        var acc = {
            AccountName: 'Foo'
        };
        sdata.create('accounts', acc, function(data, error) {
            sdata.destroy('accounts', data.$key, function(data, error) {
                expect(error).to.not.be.ok;
                expect(data).to.be.undefined;
                done();
            });
        });        
    });
    it('should call a business rule', function(done) {
    });
});