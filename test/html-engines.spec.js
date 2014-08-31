var processify = require('../.');

var assert = require('assert');

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var browserify = require('browserify');
var through = require('through');

var jade = require('jade');

describe('html engines', function() {

  it('jade can be render by processify', function(done) {

    var jadeOpts = {};

    var inputObj = {
      contents: 'div#id\n  div.test',
      fileExt: 'jade',
    };

    function output(html) {
      assert.equal(html, jade.render(inputObj.tplString, jadeOpts));
      done();
    }

    var transformOpts = {
      processorList: [{
        matchTest: function(file) {
          return /\.jade$/.exec(file);
        },
        process: function(inputString) {
          return html2jsWraper(jade.render(inputString, jadeOpts));
        }
      }]
    }

    browserifyTest(inputObj, transformOpts, output, done);

  });

});

function html2jsWraper(string) {
  return [
    'module.exports=',
    escapeContent(string),
    ';'
  ].join('\'')
}

function escapeContent(content) {
  return content.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function browserifyTest(inputObj, processifyOpts, outputFn, done) {

  generateFilePair(inputObj.fileExt, inputObj.content);

  browserify(__dirname + '/entry.case.js')

  .transform(processifyOpts, processify).bundle(function(err, buf) {

    cleanFilePair(inputObj.fileExt);

    if (err) {
      done(err);
    }
    vm.runInNewContext(String(buf), {
      output: outputFn
    }, 'test.vm');

  })
}

function generateFilePair(ext, tplString) {
  fs.writeFileSync(__dirname + '/entry.case.js',
    'output(require("./entry.case.' + ext + '"));');
  fs.writeFileSync(__dirname + '/entry.case.' + ext, tplString);
}

function cleanFilePair(ext) {
  fs.unlinkSync(__dirname + '/entry.case.js');
  fs.unlinkSync(__dirname + '/entry.case.' + ext);
}
