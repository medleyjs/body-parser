'use strict';

const BodyParserError = require('../BodyParserError');

const getContentLength = require('../getContentLength');

function createBufferParser(matchMediaType, rejectUnsupportedTypes, limit) {
  return function bufferParser(req, res, next) {
    if (!matchMediaType(req)) {
      next(
        rejectUnsupportedTypes
          ? new BodyParserError(415, `Unsupported media type: "${req.headers['content-type']}"`)
          : undefined
      );
      return;
    }

    const contentLength = getContentLength(req.headers);

    if (contentLength !== null && contentLength > limit) {
      next(new BodyParserError(413, 'Request body is too large'));
      return;
    }

    const {stream} = req;
    const chunks = [];
    var receivedLength = 0;

    stream.on('aborted', onAborted);
    stream.on('readable', onReadable);
    stream.on('end', onEnd);
    stream.on('error', onEnd);

    function onAborted() {
      onEnd(new BodyParserError(400, 'Request aborted'));
    }

    function onReadable() {
      const chunk = stream.read();
      if (chunk === null) {
        return;
      }

      receivedLength += chunk.length;

      if (receivedLength > limit) {
        onEnd(new BodyParserError(413, 'Request body is too large'));
        return;
      }

      chunks.push(chunk);
    }

    function onEnd(err) {
      stream.removeListener('aborted', onAborted);
      stream.removeListener('readable', onReadable);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onEnd);

      if (err !== undefined) {
        if (err.status === undefined) {
          err.status = 400;
        }
        next(err);
        return;
      }

      if (contentLength !== null && receivedLength !== contentLength) {
        next(new BodyParserError(400, 'Request body size did not match Content-Length'));
        return;
      }

      req.body = Buffer.concat(chunks);
      next();
    }
  };
}

module.exports = createBufferParser;
