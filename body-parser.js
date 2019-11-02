'use strict';

const compileMimeMatch = require('compile-mime-match');
const querystring = require('querystring');

const createBufferParser = require('./lib/parsers/buffer');
const createStringParser = require('./lib/parsers/string');

const DEFAULT_LIMIT = 1024 * 100; // 100 KiB

function validateLimit(limit) {
  if (typeof limit !== 'number') {
    throw new TypeError(
      `The 'limit' option must be a number. Got value with type '${typeof limit}'.`
    );
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError(`'limit' option must be an integer > 0. Got: ${limit}`);
  }
}

function getMediaTypeMatcher(type) {
  if (typeof type === 'function') {
    return type;
  }

  const mimeMatch = compileMimeMatch(type);
  return function matchMediaType(req) {
    return mimeMatch(req.headers['content-type']);
  };
}

const bodyParser = {
  buffer({
    limit = DEFAULT_LIMIT,
    type = 'application/octet-stream',
    rejectUnsupportedTypes = false,
  } = {}) {
    validateLimit(limit);

    const matchMediaType = getMediaTypeMatcher(type);

    return createBufferParser(matchMediaType, rejectUnsupportedTypes, limit);
  },

  json({
    limit = DEFAULT_LIMIT,
    type = 'application/json',
    rejectUnsupportedTypes = false,
  } = {}) {
    validateLimit(limit);

    const matchMediaType = getMediaTypeMatcher(type);

    return createStringParser(matchMediaType, rejectUnsupportedTypes, limit, JSON.parse);
  },

  text({
    limit = DEFAULT_LIMIT,
    type = 'text/plain',
    rejectUnsupportedTypes = false,
  } = {}) {
    validateLimit(limit);

    const matchMediaType = getMediaTypeMatcher(type);

    return createStringParser(matchMediaType, rejectUnsupportedTypes, limit, null);
  },

  urlEncoded({
    limit = DEFAULT_LIMIT,
    type = 'application/x-www-form-urlencoded',
    rejectUnsupportedTypes = false,
    parser = querystring.parse,
  } = {}) {
    validateLimit(limit);

    if (typeof parser !== 'function') {
      throw new TypeError(
        `The 'parser' option must be a function. Got value with type '${typeof parser}'.`
      );
    }

    const matchMediaType = getMediaTypeMatcher(type);

    return createStringParser(matchMediaType, rejectUnsupportedTypes, limit, parser);
  },
};

module.exports = bodyParser;
