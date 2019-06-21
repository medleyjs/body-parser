'use strict';

function getContentLength(headers) {
  if (headers['transfer-encoding'] !== undefined) {
    return null;
  }

  // https://tools.ietf.org/html/rfc7230#section-3.3.3 (#6)
  if (headers['content-length'] === undefined) {
    return 0;
  }

  return Number.parseInt(headers['content-length'], 10);
}

module.exports = getContentLength;
