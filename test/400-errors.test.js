'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const lightMyRequest = require('light-my-request');
const medley = require('@medley/medley');
const stream = require('stream');

async function inject(app, options) {
  await app.load();
  return lightMyRequest(app.handler, options);
}

describe('400 errors:', () => {

  for (const fnName of Object.keys(bodyParser)) {

    describe(`when using bodyParser.${fnName}()`, () => {

      it('should return a 400 error if the body size does not match the Content-Length header', async () => {
        const app = medley();

        app.post('/', [
          bodyParser[fnName]({type: 'test/type'}),
        ], () => {
          assert.fail('The handler should not run');
        });

        // Must use light-my-request to send a request with an incorrect Content-Length
        const res = await inject(app, {
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
            'Content-Length': '2',
          },
          payload: '1',
        });
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(
          JSON.parse(res.payload).message,
          'Request body size did not match Content-Length'
        );
      });

      it('should return a 400 error if the request errors', async () => {
        const app = medley();

        app.post('/', [
          bodyParser[fnName]({type: 'test/type'}),
        ], () => {
          assert.fail('The handler should not run');
        });

        const res = await inject(app, {
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
          },
          payload: '100',
          simulate: {error: true},
        });
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(JSON.parse(res.payload).message, 'Simulated');
      });

      it('should return a 400 error if the request aborts', (done) => {
        const app = medley();

        var request;
        var streamChunk = 'body';

        app.addHook('onRequest', (req, res, next) => {
          setTimeout(() => {
            streamChunk = null;
            request.cancel();
          }, 10);
          next();
        });

        app.post('/', [
          bodyParser[fnName]({type: 'test/type'}),
        ], () => {
          assert.fail('The handler should not run');
        });

        app.addHook('onError', (err) => {
          assert.strictEqual(err.status, 400);
          assert.strictEqual(err.message, 'Request aborted');
          app.close(done);
        });

        app.listen(0, (err) => {
          if (err) {
            done(err);
            return;
          }
          app.server.unref();

          request = got.post(`http://localhost:${app.server.address().port}`, {
            headers: {'Content-Type': 'test/type'},
            body: stream.Readable({
              read() {
                setTimeout(() => {
                  this.push(streamChunk);
                }, 2);
              },
            }),
          });

          request.catch((err) => {
            if (err.message !== 'Promise was canceled') {
              done(err);
            }
          });
        });
      });

    });

  }

});
