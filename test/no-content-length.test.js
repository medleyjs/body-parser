'use strict';

const assert = require('assert');
const bodyParser = require('../');
const http2 = require('http2');
const medley = require('@medley/medley');

describe('requests without a Content-Length header', () => {

  for (const fnName of Object.keys(bodyParser)) {

    describe(`when using bodyParser.${fnName}()`, () => {

      it('should treat the body as if it were "Transfer-Encoding: chunked"', (done) => {
        // Must use HTTP/2 to make a request without a Content-Length header
        const app = medley({http2: true});

        app.post('/', [
          bodyParser[fnName]({type: 'test/type'}),
        ], (req, res) => {
          assert.ok(req.body);
          res.send();
        });

        app.listen(0, (err) => {
          app.server.unref();
          assert.ifError(err);

          const session = http2.connect(`http://localhost:${app.server.address().port}`);
          session
            .request({
              ':method': 'POST',
              ':path': '/',
              'content-type': 'test/type',
            })
            .on('response', (headers) => {
              session.close();
              assert.strictEqual(headers[':status'], 200);
              assert.strictEqual(headers['content-length'], '0');
              done();
            })
            .on('error', done)
            .end('[]');
        });
      });

    });

  }

});
