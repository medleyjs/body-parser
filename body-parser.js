'use strict';

const querystring = require('querystring');

const createBufferParser = require('./lib/parsers/buffer');
const createStringParser = require('./lib/parsers/string');

const DEFAULT_LIMIT = 1024 * 1024; // 1 MiB

function getLimit(options) {
  if (!options || options.limit === undefined) {
    return DEFAULT_LIMIT;
  }

  const {limit} = options;

  if (typeof limit !== 'number') {
    throw new TypeError(`The 'limit' option must be a number. Got value with type '${typeof limit}'.`);
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError(`'limit' option must be an integer > 0. Got: ${limit}`);
  }

  return limit;
}

function getQueryStringParser(options) {
  if (!options || options.parser === undefined) {
    return querystring.parse;
  }

  const {parser} = options;

  if (typeof parser !== 'function') {
    throw new TypeError(`The 'parser' option must be a function. Got value with type '${typeof parser}'.`);
  }

  return parser;
}

const bodyParser = {
  buffer(options) {
    const limit = getLimit(options);
    return createBufferParser(limit);
  },

  text(options) {
    const limit = getLimit(options);
    return createStringParser(limit, null);
  },

  json(options) {
    const limit = getLimit(options);
    return createStringParser(limit, JSON.parse);
  },

  urlEncoded(options) {
    const limit = getLimit(options);
    const parser = getQueryStringParser(options);
    return createStringParser(limit, parser);
  },
};

module.exports = bodyParser;
