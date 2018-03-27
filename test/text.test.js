'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const medley = require('@medley/medley');

describe('bodyParser.text()', () => {

  it('should parse the request body as a string', () => {
    const app = medley();

    app.addBodyParser('text/plain', bodyParser.text());

    app.post('/', (req, res) => {
      assert.strictEqual(typeof req.body, 'string', 'req.body should be a string');
      res.send(req.body);
    });

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          headers: {'Content-Type': 'text/plain'},
          body: 'a string',
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.headers['content-type'], 'text/plain; charset=utf-8');
        assert.strictEqual(res.body, 'a string');
      });
  });

});
