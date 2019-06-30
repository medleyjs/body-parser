'use strict';

const BodyParserError = require('../BodyParserError');

const getContentLength = require('../getContentLength');

function createStringParser(matchMediaType, rejectUnsupportedTypes, limit, parser) {
  return function stringParser(req, res, next) {
    if (!matchMediaType(req)) {
      next(
        rejectUnsupportedTypes
          ? new BodyParserError(415, 'Unsupported media type')
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
    var body = '';
    var receivedLength = 0;

    stream.on('aborted', onAborted);
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onEnd);

    function onAborted() {
      onEnd(new BodyParserError(400, 'Request aborted'));
    }

    function onData(chunk) {
      receivedLength += chunk.length;

      if (receivedLength > limit) {
        onEnd(new BodyParserError(413, 'Request body is too large'));
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

      if (parser === null) {
        req.body = body;
      } else {
        try {
          req.body = parser(body);
        } catch (err) {
          if (parser === JSON.parse) {
            err.status = 400;
          }
          next(err);
          return;
        }
      }

      next();
    }
  };
}

module.exports = createStringParser;
