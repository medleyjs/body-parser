'use strict';

const BodyParserError = require('../BodyParserError');

const getContentLength = require('../getContentLength');

function createStringParser(limit, parser) {
  return function stringParser(req, done) {
    const contentLength = getContentLength(req.headers);

    if (contentLength !== null && contentLength > limit) {
      done(new BodyParserError(413, 'Request body is too large'));
      return;
    }

    const {stream} = req;
    var body = '';
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

      body += chunk.toString();
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

      if (parser !== null) {
        try {
          body = parser(body);
        } catch (err) {
          if (parser === JSON.parse) {
            err.status = 400;
          }
          done(err);
          return;
        }
      }

      done(null, body);
    }
  };
}

module.exports = createStringParser;
