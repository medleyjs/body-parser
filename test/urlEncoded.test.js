'use strict';

const assert = require('assert');
const bodyParser = require('../');
const medley = require('@medley/medley');
const querystring = require('querystring');
const selfRequest = require('@medley/self-request');

function makeApp() {
  return medley().register(selfRequest);
}

describe('bodyParser.urlEncoded()', () => {

  it('should parse the request body as a URL', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.urlEncoded()], (req, res) => {
      assert.strictEqual(typeof req.body, 'object', 'req.body should be an object');
      res.send(req.body);
    });

    const res = await app.request({
      method: 'POST',
      url: '/',
      form: {hello: 'world', a: 1},
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.deepStrictEqual(JSON.parse(res.body), {hello: 'world', a: '1'});
  });

  it('should not parse other types by default', async () => {
    const app = makeApp();

    app.post('/', [bodyParser.urlEncoded()], (req, res) => {
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

  it('should accept a custom parser', async () => {
    const app = makeApp();

    app.post('/', [
      bodyParser.urlEncoded({
        parser: body => querystring.parse(body, {maxKeys: 1}),
      }),
    ], (req, res) => {
      assert.strictEqual(typeof req.body, 'object', 'req.body should be an object');
      res.send(req.body);
    });

    const res = await app.request({
      method: 'POST',
      url: '/',
      form: {hello: 'world', a: 1},
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.deepStrictEqual(JSON.parse(res.body), {hello: 'world&a=1'});
  });

  it('should throw if the custom parser is not a function', () => {
    assert.throws(
      () => bodyParser.urlEncoded({parser: true}),
      /The 'parser' option must be a function\. Got value with type 'boolean'\./
    );
    assert.throws(
      () => bodyParser.urlEncoded({parser: 20}),
      /The 'parser' option must be a function\. Got value with type 'number'\./
    );
  });

  it('should return a 500 error if the custom parser throws', async () => {
    const app = makeApp();

    app.post('/', [
      bodyParser.urlEncoded({
        parser() {
          throw new Error('parser error');
        },
      }),
    ], () => {
      assert.fail('The handler should not run');
    });

    const res = await app.request({
      method: 'POST',
      url: '/',
      form: {hello: 'world', a: 1},
    });
    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(JSON.parse(res.body), {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'parser error',
    });
  });

});
