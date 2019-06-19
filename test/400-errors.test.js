'use strict';

const assert = require('assert');
const bodyParser = require('../');
const got = require('got');
const lightMyRequest = require('light-my-request');
const medley = require('@medley/medley');
const stream = require('stream');

async function inject(app, options) {
  await app.load();
  return lightMyRequest(app.server.listeners('request')[0], options);
}

describe('400 errors:', () => {

  ['buffer', 'text', 'json', 'urlEncoded'].forEach((fnName) => {

    describe(`when using bodyParser.${fnName}()`, () => {

      it('should return a 400 error if the body size does not match the Content-Length header', () => {
        const app = medley();

        app.addBodyParser('test/type', bodyParser[fnName]());

        app.post('/', (req, res) => res.send());

        // Must use light-my-request to send a request with an incorrect Content-Length
        return inject(app, {
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
            'Content-Length': '2',
          },
          payload: '1',
        }).then((res) => {
          assert.strictEqual(res.statusCode, 400);
          assert.strictEqual(
            JSON.parse(res.payload).message,
            'Request body size did not match Content-Length'
          );
        });
      });

      it('should return a 400 error if the request errors', () => {
        const app = medley();

        app.addBodyParser('test/type', bodyParser[fnName]());

        app.post('/', (req, res) => res.send());

        return inject(app, {
          method: 'POST',
          url: '/',
          headers: {
            'Content-Type': 'test/type',
          },
          payload: '100',
          simulate: {error: true},
        }).then((res) => {
          assert.strictEqual(res.statusCode, 400);
          assert.strictEqual(JSON.parse(res.payload).message, 'Simulated');
        });
      });

      it('should return a 400 error if the request aborts', (done) => {
        const app = medley();

        app.addBodyParser('test/type', bodyParser[fnName]());

        var request;
        var streamChunk = 'body';

        app.addHook('onRequest', (req, res, next) => {
          setTimeout(() => {
            streamChunk = null;
            request.cancel();
          }, 10);
          next();
        });

        app.setErrorHandler((err) => {
          assert.strictEqual(err.status, 400);
          assert.strictEqual(err.message, 'Request aborted');
          app.close(done);
        });

        app.post('/', (req, res) => res.send());

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

  });

});
