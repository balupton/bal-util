// Generated by CoffeeScript 1.4.0
(function() {
  var assert, balUtil, joe, travis;

  assert = require('assert');

  joe = require('joe');

  balUtil = require(__dirname + '/../lib/balutil');

  travis = process.env.TRAVIS_NODE_VERSION != null;

  joe.describe('modules', function(describe, it) {
    describe('getHomePath', function(describe, it) {
      return it('should fetch something', function(done) {
        return balUtil.getHomePath(function(err, path) {
          assert.equal(err || null, null);
          console.log('home:', path);
          assert.ok(path);
          return done();
        });
      });
    });
    describe('getTmpPath', function(describe, it) {
      return it('should fetch something', function(done) {
        return balUtil.getTmpPath(function(err, path) {
          assert.equal(err || null, null);
          console.log('tmp:', path);
          assert.ok(path);
          return done();
        });
      });
    });
    describe('getGitPath', function(describe, it) {
      return it('should fetch something', function(done) {
        return balUtil.getGitPath(function(err, path) {
          assert.equal(err || null, null);
          console.log('git:', path);
          assert.ok(path);
          return done();
        });
      });
    });
    describe('getNodePath', function(describe, it) {
      return it('should fetch something', function(done) {
        return balUtil.getNodePath(function(err, path) {
          assert.equal(err || null, null);
          console.log('node:', path);
          assert.ok(path);
          return done();
        });
      });
    });
    describe('getNpmPath', function(describe, it) {
      return it('should fetch something', function(done) {
        return balUtil.getNpmPath(function(err, path) {
          assert.equal(err || null, null);
          console.log('npm:', path);
          assert.ok(path);
          return done();
        });
      });
    });
    return describe('getExecPath', function(describe, it) {
      return it('should fetch something', function(done) {
        return balUtil.getExecPath('ruby', function(err, path) {
          assert.equal(err || null, null);
          console.log('npm:', path);
          assert.ok(path);
          return done();
        });
      });
    });
  });

}).call(this);
