'use strict';

function getContentLength(headers) {
  if (headers['transfer-encoding'] !== undefined) {
    return null;
  }

  /* istanbul ignore if - Node will error before this happens, but included just in case */
  if (headers['content-length'] === undefined) {
    return 0;
  }

  return Number.parseInt(headers['content-length'], 10);
}

module.exports = getContentLength;
