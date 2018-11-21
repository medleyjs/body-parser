'use strict';

const BodyParserError = require('../BodyParserError');

const getContentLength = require('../getContentLength');

function createBufferParser(limit) {
  return function bufferParser(req, done) {
    const contentLength = getContentLength(req.headers);

    if (contentLength !== null && contentLength > limit) {
      done(new BodyParserError(413, 'Request body is too large'));
      return;
    }

    const {stream} = req;
    const chunks = [];
    var receivedLength = 0;

    stream.on('aborted', onAborted);
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onEnd);

    function onAborted() {
      stream.removeListener('aborted', onAborted);
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onEnd);
      done(new BodyParserError(400, 'Request aborted'));
    }

    function onData(chunk) {
      receivedLength += chunk.length;

      if (receivedLength > limit) {
        stream.removeListener('aborted', onAborted);
        stream.removeListener('data', onData);
        stream.removeListener('end', onEnd);
        stream.removeListener('error', onEnd);
        done(new BodyParserError(413, 'Request body is too large'));
        return;
      }

      chunks.push(chunk);
    }

    function onEnd(err) {
      stream.removeListener('aborted', onAborted);
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onEnd);

      if (err !== undefined) {
        err.status = 400;
        done(err);
        return;
      }

      if (contentLength !== null && receivedLength !== contentLength) {
        done(new BodyParserError(400, 'Request body size did not match Content-Length'));
        return;
      }

      done(null, Buffer.concat(chunks));
    }
  };
}

module.exports = createBufferParser;
