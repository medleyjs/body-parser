'use strict';

const assert = require('assert');
const bodyParser = require('../');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');
const stream = require('stream');

function makeApp() {
  return medley().register(selfRequest);
}

describe('limit option', () => {

  for (const fnName of Object.keys(bodyParser)) {

    describe(`passed to bodyParser.${fnName}()`, () => {

      it('defaults to 100 KiB', async () => {
        const app = makeApp();
        const maxLength = 1024 * 100;

        app.post('/', [
          bodyParser[fnName]({type: '*/*'}),
        ], (req, res) => {
          res.send(String(req.body.length || maxLength));
        });

        let res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
            'Content-Length': maxLength,
          },
          body: Buffer.alloc(maxLength, '1'),
        });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body, String(maxLength));

        res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
            'Content-Length': maxLength + 1,
          },
          body: Buffer.allocUnsafe(maxLength + 1),
        });
        assert.strictEqual(res.statusCode, 413);
        assert.strictEqual(JSON.parse(res.body).message, 'Request body is too large');
      });

      it('causes an error if it is not a number', () => {
        assert.throws(
          () => bodyParser[fnName]({limit: null}),
          /The 'limit' option must be a number\. Got value with type 'object'\./
        );
      });

      it('causes an error if it is not an integer > 0', () => {
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

      it('causes a 413 error if the request Content-Length is larger than the limit', async () => {
        const app = makeApp();

        app.post('/', [
          bodyParser[fnName]({
            limit: 5,
            type: 'test/type',
          }),
        ], () => {
          assert.fail('The handler should not run');
        });

        const res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
            'Content-Length': 6,
          },
          body: '123456',
        });
        assert.strictEqual(res.statusCode, 413);
        assert.strictEqual(JSON.parse(res.body).message, 'Request body is too large');
      });

      it('causes a 413 error if the request body is larger than the limit', async () => {
        const app = makeApp();

        let chunk = '123456';
        const bodyStream = new stream.Readable({
          read() {
            this.push(chunk);
            chunk = null;
          },
        });

        app.post('/', [
          bodyParser[fnName]({
            limit: 5,
            type: 'test/type',
          }),
        ], () => {
          assert.fail('The handler should not run');
        });

        const res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
            'Transfer-Encoding': 'chunked',
          },
          body: bodyStream,
        });
        assert.strictEqual(res.statusCode, 413);
        assert.strictEqual(JSON.parse(res.body).message, 'Request body is too large');
      });

    });

  }

});
