'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const medley = require('@medley/medley');

describe('bodyParser.json()', () => {

  it('should parse the request body as JSON', () => {
    const app = medley();

    app.addBodyParser('application/json', bodyParser.json());

    app.post('/', (req, res) => {
      assert.deepStrictEqual(req.body, {hello: 'world'});
      res.send(req.body);
    });

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          body: {hello: 'world'},
          json: true,
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type'], 'application/json');
        assert.deepStrictEqual(res.body, {hello: 'world'});
      });
  });

  it('should return a 400 error for malformed JSON', () => {
    const app = medley();

    app.addBodyParser('application/json', bodyParser.json());

    app.post('/', (req, res) => res.send());

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          headers: {'Content-Type': 'application/json'},
          body: '{hello:',
          throwHttpErrors: false,
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.headers['content-type'], 'application/json');
        assert.deepStrictEqual(JSON.parse(res.body), {
          statusCode: 400,
          error: 'Bad Request',
          message: 'Unexpected token h in JSON at position 1',
        });
      });
  });

});
