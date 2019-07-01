'use strict';

function getContentLength(headers) {
  if (
    headers['transfer-encoding'] !== undefined ||
    headers['content-length'] === undefined
  ) {
    return null;
  }

  return Number(headers['content-length']);
}

module.exports = getContentLength;
