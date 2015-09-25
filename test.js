'use strict';

var superagent = require('superagent');
var chai = require('chai');
var expect = chai.expect;
var should = require('should');
var token = process.env.TOKEN;
var apiPort = process.env.API_PORT || 3001
var apiURL = 'http://localhost:'+ apiPort + '/';

describe('Index', function() {
  it('renders something', function(done) {
    superagent.get(apiURL)
    .end(function(err, res) {
      (err === null).should.equal(true);
      res.statusCode.should.equal(200);
      done();
    });
  });
});

describe('Open issues', function() {
  it('renders open issues info', function(done) {
    superagent.get(apiURL + 'issues?repo=shippable/support' +
      '&token=' + token + '&days=2&daysEnd=5&state=Open')
    .end(function(err, res) {
      (err === null).should.equal(true);
      res.should.be.json;
      res.text.should.containEql('open');
      res.statusCode.should.equal(200);
      done();
    });
  });
});

describe('Closed issues', function() {
  it('renders closed issues info', function(done) {
    superagent.get(apiURL + 'issues?repo=shippable/support&' +
      '&token=' + token + '&days=2&daysEnd=5&state=Close')
    .end(function(err, res) {
      (err === null).should.equal(true);
      res.should.be.json;
      res.text.should.containEql('close');
      res.statusCode.should.equal(200);
      done();
    });
  });
});

describe('Failed auth', function() {
  it('Should not render issues page, instead main page', function(done) {
    superagent.get(apiURL + 'issues?repo=shippable/support&token=no&days=' +
    '2&daysEnd=5&state=Open')
    .end(function(err, res) {
      res.text.should.not.containEql('open');
      res.text.should.not.containEql('close');
      done();
    });
  });
});
