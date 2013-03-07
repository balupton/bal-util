// Generated by CoffeeScript 1.4.0
(function() {
  var assert, balUtil, joe, travis;

  assert = require('assert');

  joe = require('joe');

  balUtil = require(__dirname + '/../lib/balutil');

  travis = process.env.TRAVIS_NODE_VERSION != null;

  joe.describe('modules', function(describe, it) {
    describe('locale', function(describe, it) {
      describe('getLocaleCode', function(describe, it) {
        it('should fetch something', function() {
          var localeCode;
          localeCode = balUtil.getLocaleCode();
          console.log('localeCode:', localeCode);
          return assert.ok(localeCode);
        });
        return it('should fetch something when passed something', function() {
          var localeCode;
          localeCode = balUtil.getLocaleCode('fr-CH');
          assert.equal(localeCode, 'fr_ch');
          localeCode = balUtil.getLocaleCode('fr_CH');
          return assert.equal(localeCode, 'fr_ch');
        });
      });
      describe('getCountryCode', function(describe, it) {
        it('should fetch something', function() {
          var countryCode;
          countryCode = balUtil.getCountryCode();
          console.log('countryCode:', countryCode);
          return assert.ok(countryCode);
        });
        return it('should fetch something when passed something', function() {
          var countryCode;
          countryCode = balUtil.getCountryCode('fr-CH');
          return assert.equal(countryCode, 'ch');
        });
      });
      return describe('getLanguageCode', function(describe, it) {
        it('should fetch something', function() {
          var languageCode;
          languageCode = balUtil.getLanguageCode();
          console.log('languageCode:', languageCode);
          return assert.ok(languageCode);
        });
        return it('should fetch something when passed something', function() {
          var languageCode;
          languageCode = balUtil.getLanguageCode('fr-CH');
          return assert.equal(languageCode, 'fr');
        });
      });
    });
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
          console.log('ruby:', path);
          assert.ok(path);
          return done();
        });
      });
    });
  });

}).call(this);
