## br processor

Use for [browserify transform](https://github.com/substack/node-browserify#btransformopts-tr)
and translate code of template engine or pre-proccessor to javascript string.

[![Build Status](https://travis-ci.org/morlay/br-processor.svg?branch=master)](https://travis-ci.org/morlay/br-processor)
[![Dependencies](https://david-dm.org/morlay/br-processor.png)](https://david-dm.org/morlay/br-processor)

Support most pre-precessor which has sync api;

## Options

* `processorList`
  - `matchTest` to test file's ext and return boolean to tell browserfiy transform;
  - `process` a process translate **input string** to browserify js code;

## Demo

Then use for `b.transform(transformOpts,brProcessor)`

  var jade = require('jade');

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
