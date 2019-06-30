'use strict';

const assert = require('assert');
const bodyParser = require('../');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');

function makeApp() {
  return medley().register(selfRequest);
}

describe('bodyParser.text()', () => {

  it('should parse the request body as a string', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.text()], (req, res) => {
      assert.strictEqual(typeof req.body, 'string', 'req.body should be a string');
      res.send(req.body);
    });

    const res = await app.request({
      method: 'POST',
      url: '/',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'a string',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8');
    assert.strictEqual(res.body, 'a string');
  });

  it('should not parse other types by default', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.text()], (req, res) => {
      assert.strictEqual(req.body, undefined);
      res.send(String(req.body));
    });

    let res = await app.request({
      method: 'POST',
      url: '/',
      headers: {
        'Content-Type': 'test/type',
      },
      body: '123',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'undefined');

    // No Content-Type
    res = await app.request({
      method: 'POST',
      url: '/',
      body: '123',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'undefined');
  });

});
