var processify = require('../.');

var assert = require('assert');

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var browserify = require('browserify');
var through = require('through');

var jade = require('jade');
var swig = require('swig');

describe('html engines', function() {

  it('pure html can be render by processify', function(done) {

    var inputObj = {
      contents: '<h1> asdasd </h1> \n <p> ppppp </p>',
      fileExt: '.html',
    };

    function output(html) {
      assert.equal(html, inputObj.contents);
      done();
    }

    var transformOpts = {
      processorList: [{
        matchTest: function(file) {
          return /\.html$/.exec(file);
        },
        process: function(inputString) {
          return html2jsWraper(inputString);
        }
      }]
    }

    browserifyTest(inputObj, transformOpts, output, done);

  });

  it('jade can be render by processify', function(done) {

    var jadeOpts = {};

    var inputObj = {
      contents: 'div#id\n  div.test',
      fileExt: '.jade',
    };

    function output(html) {
      assert.equal(html, jade.render(inputObj.contents, jadeOpts));
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

  it('swig can be render by processify', function(done) {

    var data = {
      pagename: 'awesome people'
    };

    var inputObj = {
      contents: '<h1>{{ pagename|title }}</h1>',
      fileExt: '.tpl.html',
    };

    function output(html) {
      assert.equal(html, swig.compile(inputObj.contents)(data));
      done();
    }

    var transformOpts = {
      processorList: [{
        matchTest: function(file) {
          return /\.tpl\.html$/.exec(file);
        },
        process: function(inputString) {
          return html2jsWraper(swig.compile(inputObj.contents)(data));
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
  return content.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r?\n/g,
    '\\n\' +\n    \'');
}

function browserifyTest(inputObj, processifyOpts, outputFn, done) {

  generateFilePair(inputObj.fileExt, inputObj.contents);

  browserify(__dirname + '/entry' + inputObj.fileExt + '.case.js')

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

function generateFilePair(fileExt, contents) {
  fs.writeFileSync(__dirname + '/entry' + fileExt + '.case.js',
    'output(require("./entry.case' + fileExt + '"));');
  fs.writeFileSync(__dirname + '/entry.case' + fileExt, contents);
}

function cleanFilePair(fileExt) {
  fs.unlinkSync(__dirname + '/entry' + fileExt + '.case.js');
  fs.unlinkSync(__dirname + '/entry.case' + fileExt);
}
