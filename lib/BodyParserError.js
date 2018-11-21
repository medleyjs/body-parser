'use strict';

class BodyParserError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.status = statusCode;
  }
}

Object.defineProperty(BodyParserError.prototype, 'name', {
  value: BodyParserError.name,
  writable: true,
  enumerable: false,
  configurable: true,
});

module.exports = BodyParserError;
