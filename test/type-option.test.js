'use strict';

const assert = require('assert');
const bodyParser = require('../');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');

function makeApp() {
  return medley().register(selfRequest);
}

describe('type option', () => {

  for (const fnName of Object.keys(bodyParser)) {

    describe(`passed to bodyParser.${fnName}()`, () => {

      it('should cause an error to be thrown if it is not a valid value', () => {
        assert.throws(
          () => bodyParser[fnName]({type: null}),
          err => err instanceof TypeError
        );
        assert.throws(
          () => bodyParser[fnName]({type: true}),
          err => err instanceof TypeError
        );
        assert.throws(
          () => bodyParser[fnName]({type: 123}),
          err => err instanceof TypeError
        );
        assert.throws(
          () => bodyParser[fnName]({type: [123]}),
          err => err instanceof TypeError
        );
      });

      it('should allow parsing custom media types', async () => {
        const app = makeApp();

        app.post('/', [bodyParser[fnName]({type: 'test/type'})], (req, res) => {
          assert.notStrictEqual(req.body, undefined);
          res.send(req.body);
        });

        app.post('/no-parse', [bodyParser[fnName]({type: 'test/type'})], (req, res) => {
          assert.strictEqual(req.body, undefined);
          res.send(String(req.body));
        });

        app.post('/fn', {
          preHandler: bodyParser[fnName]({
            type: req => req.headers['content-type'] === 'test/type',
          }),
        }, (req, res) => {
          assert.notStrictEqual(req.body, undefined);
          res.send(req.body);
        });

        app.post('/fn/no-parse', {
          preHandler: bodyParser[fnName]({
            type: req => req.headers['content-type'] === 'test/type',
          }),
        }, (req, res) => {
          assert.strictEqual(req.body, undefined);
          res.send(String(req.body));
        });

        app.post('/any-valid', {
          preHandler: bodyParser[fnName]({type: ['*/*']}),
        }, (req, res) => {
          assert.notStrictEqual(req.body, undefined);
          res.send(req.body);
        });

        app.post('/any-valid/no-parse', {
          preHandler: bodyParser[fnName]({type: ['*/*']}),
        }, (req, res) => {
          assert.strictEqual(req.body, undefined);
          res.send(String(req.body));
        });

        app.post('/any', [bodyParser[fnName]({type: () => true})], (req, res) => {
          assert.notStrictEqual(req.body, undefined);
          res.send(req.body);
        });

        // Custom MIME type
        let res = await app.request({
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);

        res = await app.request({
          method: 'POST',
          url: '/no-parse',
          headers: {
            'Content-Type': 'not-test/type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body, 'undefined');

        // Custom function
        res = await app.request({
          method: 'POST',
          url: '/fn',
          headers: {
            'Content-Type': 'test/type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);

        res = await app.request({
          method: 'POST',
          url: '/fn/no-parse',
          headers: {
            'Content-Type': 'not-test/type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body, 'undefined');

        // MIME type array
        res = await app.request({
          method: 'POST',
          url: '/any-valid',
          headers: {
            'Content-Type': 'literally/any',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);

        res = await app.request({
          method: 'POST',
          url: '/any-valid/no-parse',
          headers: {
            'Content-Type': 'invalid-type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body, 'undefined');

        // Any
        res = await app.request({
          method: 'POST',
          url: '/any',
          headers: {
            'Content-Type': 'literally/any',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);

        res = await app.request({
          method: 'POST',
          url: '/any',
          headers: {
            'Content-Type': 'invalid-type',
          },
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);

        res = await app.request({ // No Content-Type
          method: 'POST',
          url: '/any',
          body: '[]',
        });
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body);
      });

    });

  }

});
