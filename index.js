var through = require('through');

var defaults = {
  processorList: []
};

module.exports = function(file, options) {

  configureFix(options);

  var processor = processorFor(file);

  if (!processor) return through();

  var inputString = '';

  return through(write, end);

  function write(buf) {
    inputString += buf
  }

  function end() {
    var stream = this;
    try {
      var result = processor.process(inputString);
      if (typeof result === 'string') {
        stream.queue(result);
        stream.queue(null);
      } else {
        stream.queue('');
        stream.queue(null);
      }
    } catch (error) {
      stream.emit('error', error);
    }

  }
};

module.exports.configure = configureFix;

function processorFor(file) {
  var matchedProcessor = null;
  defaults.processorList.forEach(function(processor) {
    if (processor.matchTest(file)) {
      matchedProcessor = processor
    };
  });
  return matchedProcessor;
}

function configureFix(options) {
  if (options && options.processorList) {
    defaults.processorList = options.processorList;
  }
}
