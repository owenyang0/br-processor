var processify = require('../.');

var assert = require('assert');

var path = require('path');
var fs = require('fs');
var vm = require('vm');

var browserify = require('browserify');
var through = require('through');

var sass = require('node-sass');
var stylus = require('stylus');
var autoprefixerStylus = require('autoprefixer-stylus');

describe('css engines', function() {

  it('pure css can be render by processify', function(done) {

    var inputObj = {
      contents: '.body { color:red; }',
      fileExt: '.css',
    };

    function output(result) {
      assert.equal(result, inputObj.contents);
      done();
    }

    var transformOpts = {
      processorList: [{
        matchTest: function(file) {
          return /\.css$/.exec(file);
        },
        process: function(inputString) {
          return css2jsWraper(inputString);
        }
      }]
    }

    browserifyTest(inputObj, transformOpts, output, done);

  });

  it('stylus can be render by processify', function(done) {

    var inputObj = {
      contents: '.body { transform: translate3d(0,0,0);}',
      fileExt: '.styl',
    };

    var browsers = {
      browsers: ['> 1%', 'last 10 version', 'ie 8', 'Firefox ESR',
        'Opera 12.1'
      ]
    }

      function output(result) {
        assert.equal(result, stylus(inputObj.contents).use(
          autoprefixerStylus(browsers)).render());
        done();
      }

    var transformOpts = {
      processorList: [{
        matchTest: function(file) {
          return /\.styl$/.exec(file);
        },
        process: function(inputString) {
          return css2jsWraper(
            stylus(inputString)
            .use(autoprefixerStylus(browsers))
            .render());
        }
      }]
    }

    browserifyTest(inputObj, transformOpts, output, done);

  });

  it('scss can be render by processify', function(done) {

    var inputObj = {
      contents: '$transfrom: translate3d(0,0,0); .body { transform: $transfrom; }',
      fileExt: '.scss',
    };

    function output(result) {
      assert.equal(result, String(sass.renderSync({
        data: inputObj.contents
      }).css));
      done();
    }

    var transformOpts = {
      processorList: [{
        matchTest: function(file) {
          return /\.scss$/.exec(file);
        },
        process: function(inputString) {
          return css2jsWraper(sass.renderSync({
            data: inputString
          }).css);
        }
      }]
    }

    browserifyTest(inputObj, transformOpts, output, done);

  });

});

function css2jsWraper(string) {
  return [
    'require("insert-css")(',
    escapeContent(String(string)),
    ');'
  ].join('\'')
}

function escapeContent(content) {
  return content.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(
    /\r?\n/g,
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
      document: {
        createElement: function() {
          function Elem() {
            this.textContent = ''
          }
          Elem.prototype.setAttribute = function() {}
          return new Elem()
        },
        getElementsByTagName: function() {
          return [{
            appendChild: function(elem) {
              outputFn(elem.textContent);
            }
          }]
        }
      }
    }, 'test.vm');

  })
}

function generateFilePair(fileExt, contents) {
  fs.writeFileSync(__dirname + '/entry' + fileExt + '.case.js',
    'require("./entry.case' + fileExt + '");');
  fs.writeFileSync(__dirname + '/entry.case' + fileExt, contents);
}

function cleanFilePair(fileExt) {
  fs.unlinkSync(__dirname + '/entry' + fileExt + '.case.js');
  fs.unlinkSync(__dirname + '/entry.case' + fileExt);
}
