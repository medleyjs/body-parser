'use strict';

class HTTPError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.status = statusCode;
  }
}

module.exports = HTTPError;
