'use strict';

const assert = require('assert');
const bodyParser = require('../');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');

function makeApp() {
  return medley().register(selfRequest);
}

describe('rejectUnsupportedTypes option', () => {

  for (const fnName of Object.keys(bodyParser)) {

    describe(`passed to bodyParser.${fnName}()`, () => {

      it('should cause a 415 error for unsupported media types', async () => {
        const app = makeApp();

        app.post('/', [
          bodyParser[fnName]({
            type: 'test/type',
            rejectUnsupportedTypes: true,
          }),
        ], (req, res) => {
          assert.notStrictEqual(req.body, undefined);
          res.send(req.body);
        });

        app.post('/none', [
          bodyParser[fnName]({
            type: () => false,
            rejectUnsupportedTypes: true,
          }),
        ], (req, res) => {
          assert.notStrictEqual(req.body, undefined);
          res.send(req.body);
        });

        let res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type', // Supported type
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);

        res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'unsupported/type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 415);
        assert.strictEqual(
          JSON.parse(res.body).message,
          'Unsupported media type: "unsupported/type"'
        );

        // No types accepted
        res = await app.request({
          method: 'POST',
          url: '/none',
          headers: {
            'content-type': 'text/plain',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 415);
        assert.strictEqual(JSON.parse(res.body).message, 'Unsupported media type: "text/plain"');

        res = await app.request({ // No Content-Type
          method: 'POST',
          url: '/none',
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 415);
        assert.strictEqual(JSON.parse(res.body).message, 'Unsupported media type: "undefined"');
      });

    });

  }

});
