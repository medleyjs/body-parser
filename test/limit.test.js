'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const medley = require('@medley/medley');

describe('limit option', () => {

  ['buffer', 'text', 'json', 'urlEncoded'].forEach((fnName) => {

    describe(`passed to bodyParser.${fnName}()`, () => {

      it('should cause an error if it is not a number', () => {
        assert.throws(
          () => bodyParser[fnName]({limit: null}),
          /The 'limit' option must be a number\. Got value with type 'object'\./
        );
      });

      it('should cause an error if it is not an integer > 0', () => {
        assert.throws(
          () => bodyParser[fnName]({limit: 0}),
          /'limit' option must be an integer > 0\. Got: 0/
        );
        assert.throws(
          () => bodyParser[fnName]({limit: -10}),
          /'limit' option must be an integer > 0\. Got: -10/
        );
        assert.throws(
          () => bodyParser[fnName]({limit: NaN}),
          /'limit' option must be an integer > 0\. Got: NaN/
        );
        assert.throws(
          () => bodyParser[fnName]({limit: Infinity}),
          /'limit' option must be an integer > 0\. Got: Infinity/
        );
      });

      it('should cause a 413 error if the request Content-Length is larger than the limit', () => {
        const app = medley();

        app.addBodyParser('test/type', bodyParser[fnName]({limit: 5}));

        app.post('/', (req, res) => res.send());

        return app.listen(0)
          .then(() => {
            app.server.unref();
            return got.post(`http://localhost:${app.server.address().port}`, {
              headers: {
                'Content-Type': 'test/type',
                'Content-Length': 6,
              },
              body: '1',
              throwHttpErrors: false,
            });
          })
          .then((res) => {
            assert.strictEqual(res.statusCode, 413);
            assert.strictEqual(JSON.parse(res.body).message, 'Request body is too large');
          });
      });

      it('should cause a 413 error if the request body is larger than the limit', () => {
        const app = medley();

        app.addBodyParser('test/type', bodyParser[fnName]({limit: 5}));

        app.post('/', (req, res) => res.send());

        return app.listen(0)
          .then(() => {
            app.server.unref();
            return got.post(`http://localhost:${app.server.address().port}`, {
              headers: {
                'Content-Type': 'test/type',
                'Transfer-Encoding': 'chunked',
              },
              body: '123456',
              throwHttpErrors: false,
            });
          })
          .then((res) => {
            assert.strictEqual(res.statusCode, 413);
            assert.strictEqual(JSON.parse(res.body).message, 'Request body is too large');
          });
      });

    });

  });

});
