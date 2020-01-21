'use strict';

const assert = require('assert');
const bodyParser = require('../');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');

function makeApp() {
  return medley().register(selfRequest);
}

describe('bodyParser.json()', () => {

  it('should parse the request body as JSON', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.json()], (req, res) => {
      assert.deepStrictEqual(req.body, {hello: 'world'});
      res.send(req.body);
    });

    const res = await app.request({
      method: 'POST',
      url: '/',
      json: {hello: 'world'},
      responseType: 'json',
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.deepStrictEqual(res.body, {hello: 'world'});
  });

  it('should not parse other types by default', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.json()], (req, res) => {
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

  it('should return a 400 error for malformed JSON', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.json()], (req, res) => res.send());

    const res = await app.request({
      method: 'POST',
      url: '/',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{hello:',
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.deepStrictEqual(JSON.parse(res.body), {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Unexpected token h in JSON at position 1',
    });
  });

});
