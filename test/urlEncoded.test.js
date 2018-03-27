'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const medley = require('@medley/medley');
const querystring = require('querystring');

describe('bodyParser.urlEncoded()', () => {

  it('should parse the request body as a URL', () => {
    const app = medley();

    app.addBodyParser('application/x-www-form-urlencoded', bodyParser.urlEncoded());

    app.post('/', (req, res) => {
      assert.equal(typeof req.body, 'object', 'req.body should be an object');
      res.send(req.body);
    });

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          body: {hello: 'world', a: 1},
          form: true,
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type'], 'application/json');
        assert.deepStrictEqual(JSON.parse(res.body), {hello: 'world', a: '1'});
      });
  });

  it('should accept a custom parser', () => {
    const app = medley();

    function parser(body) {
      return querystring.parse(body, {maxKeys: 1});
    }

    app.addBodyParser('application/x-www-form-urlencoded', bodyParser.urlEncoded({parser}));

    app.post('/', (req, res) => {
      assert.equal(typeof req.body, 'object', 'req.body should be an object');
      res.send(req.body);
    });

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          body: {hello: 'world', a: 1},
          form: true,
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type'], 'application/json');
        assert.deepStrictEqual(JSON.parse(res.body), {hello: 'world&a=1'});
      });
  });

  it('should throw if the custom parser is not a function', () => {
    assert.throws(
      () => bodyParser.urlEncoded({parser: true}),
      "The 'parser' option must be a function. Got value with type 'boolean'."
    );
    assert.throws(
      () => bodyParser.urlEncoded({parser: 20}),
      "The 'parser' option must be a function. Got value with type 'number'."
    );
  });

  it('should return a 500 error if the custom parser throws', () => {
    const app = medley();

    function parser() {
      throw new Error('parser error');
    }

    app.addBodyParser('application/x-www-form-urlencoded', bodyParser.urlEncoded({parser}));

    app.post('/', (req, res) => res.send());

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          body: {hello: 'world', a: 1},
          form: true,
          throwHttpErrors: false,
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 500);
        assert.deepStrictEqual(JSON.parse(res.body), {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'parser error',
        });
      });
  });

});
