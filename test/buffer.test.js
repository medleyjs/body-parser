'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const medley = require('@medley/medley');

describe('bodyParser.buffer()', () => {

  it('should parse the request body as a buffer', () => {
    const app = medley();

    app.addBodyParser('test/type', bodyParser.buffer());

    app.post('/', (req, res) => {
      assert.ok(req.body instanceof Buffer, 'req.body should be a buffer');
      res.send(req.body);
    });

    return app.listen(0)
      .then(() => {
        app.server.unref();
        return got.post(`http://localhost:${app.server.address().port}`, {
          headers: {'Content-Type': 'test/type'},
          body: '1',
        });
      })
      .then((res) => {
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body, '1');
      });
  });

});
