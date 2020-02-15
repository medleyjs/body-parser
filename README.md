# @medley/body-parser

[![npm Version](https://img.shields.io/npm/v/@medley/body-parser.svg)](https://www.npmjs.com/package/@medley/body-parser)
[![Build Status](https://travis-ci.org/medleyjs/body-parser.svg?branch=master)](https://travis-ci.org/medleyjs/body-parser)
[![Coverage Status](https://coveralls.io/repos/github/medleyjs/body-parser/badge.svg?branch=master)](https://coveralls.io/github/medleyjs/body-parser?branch=master)
[![dependencies Status](https://img.shields.io/david/medleyjs/body-parser.svg)](https://david-dm.org/medleyjs/body-parser)

Essential body parsers for [Medley](https://github.com/medleyjs/medley).

This module provides the following parsers:

+ [JSON body parser](#bodyparserjsonoptions)
+ [Text body parser](#bodyparsertextoptions)
+ [URL-encoded body parser](#bodyparserurlencodedoptions)
+ [Buffer body parser](#bodyparserbufferoptions)

## Installation

```sh
npm install @medley/body-parser
# or
yarn add @medley/body-parser
```

## API

```js
const bodyParser = require('@medley/body-parser');
```

The `bodyParser` module exposes various factory functions that create a body-parsing
[`onRequest`/`preHandler` hook](https://github.com/medleyjs/medley/blob/master/docs/Hooks.md#onRequest-hook).
All factory functions take an `options` object for configuration.

```js
const bodyParser = require('@medley/body-parser');
const medley = require('@medley/medley');
const app = medley();

app.post('/user', {
  preHandler: bodyParser.json()
}, function handler(req, res) {
  req.body // Contains the request body
});
```

**Note:** Using body-parsers as a route-level `preHandler` rather than a global
`onRequest` hook is better for performance and security since this avoids
running the hook for requests that don’t need it (such as `GET` requests and
requests that don’t match a route). This also gives you more control over where
the body-parser runs, allowing you to ensure that it will only run after things
like authentication and authorization hooks.

---

### `bodyParser.json([options])`

Returns a hook that parses request bodies as JSON using
[`JSON.parse()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse).

#### Options

##### limit

Type: `number`<br>
Default: `102400` (100 KiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.json({limit: 100000})
```

##### type

Type: `string` | `Array<string>` | `function`<br>
Default: `'application/json'`

Determines whether or not to parse the request body based on the request’s
media type. If a [MIME type] string or array of strings, it uses
[`compile-mime-match`] to match against the request’s `Content-Type` header.
If a function, it is called as `fn(req)` and the request will be parsed if
the function returns a truthy value.

```js
bodyParser.json({type: '*/json'})
```

##### rejectUnsupportedTypes

Type: `boolean`<br>
Default: `false`

Throw a `415 Unsupported Media Type` error if the request media type does not
match the `type` option.

---

### `bodyParser.text([options])`

Returns a hook that parses request bodies into a `string`.

#### Options

##### limit

Type: `number`<br>
Default: `102400` (100 KiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.text({limit: 100000})
```

##### type

Type: `string` | `Array<string>` | `function`<br>
Default: `'text/plain'`

Determines whether or not to parse the request body based on the request’s
media type. If a [MIME type] string or array of strings, it uses
[`compile-mime-match`] to match against the request’s `Content-Type` header.
If a function, it is called as `fn(req)` and the request will be parsed if
the function returns a truthy value.

```js
bodyParser.text({type: 'text/*'})
```

##### rejectUnsupportedTypes

Type: `boolean`<br>
Default: `false`

Throw a `415 Unsupported Media Type` error if the request media type does not
match the `type` option.

---

### `bodyParser.urlEncoded([options])`

Returns a hook that parses URL-encoded request bodies into an `object`.

#### Options

##### limit

Type: `number`<br>
Default: `102400` (100 KiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.urlEncoded({limit: 100000})
```

##### type

Type: `string` | `Array<string>` | `function`<br>
Default: `'application/x-www-form-urlencoded'`

Determines whether or not to parse the request body based on the request’s
media type. If a [MIME type] string or array of strings, it uses
[`compile-mime-match`] to match against the request’s `Content-Type` header.
If a function, it is called as `fn(req)` and the request will be parsed if
the function returns a truthy value.

```js
bodyParser.urlEncoded({type: '*/x-www-form-urlencoded'})
```

##### rejectUnsupportedTypes

Type: `boolean`<br>
Default: `false`

Throw a `415 Unsupported Media Type` error if the request media type does not
match the `type` option.

##### parser

Type: `function`<br>
Default: [`querystring.parse`](https://nodejs.org/api/querystring.html#querystring_querystring_parse_str_sep_eq_options)

Specifies the function that will parse the request body from a string into an
object. This can be used as a way to call `querystring.parse()` with options.

```js
const querystring = require('querystring');

function customParser(body) {
  return querystring.parse(body, null, null, {maxKeys: 20});
}

bodyParser.urlEncoded({parser: customParser})
```

---

### `bodyParser.buffer([options])`

Returns a hook that parses request bodies into a `Buffer`.

#### Options

##### limit

Type: `number`<br>
Default: `102400` (100 KiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.buffer({limit: 100000})
```

##### type

Type: `string` | `Array<string>` | `function`<br>
Default: `'application/octet-stream'`

Determines whether or not to parse the request body based on the request’s
media type. If a [MIME type] string or array of strings, it uses
[`compile-mime-match`] to match against the request’s `Content-Type` header.
If a function, it is called as `fn(req)` and the request will be parsed if
the function returns a truthy value.

```js
bodyParser.buffer({type: 'image/png'})

// Parse every request, regardless of its media type
bodyParser.buffer({type: () => true})
```

##### rejectUnsupportedTypes

Type: `boolean`<br>
Default: `false`

Throw a `415 Unsupported Media Type` error if the request media type does not
match the `type` option.

---

### Reusable Hooks Pattern

To avoid having to create a new hook for every route that needs one, a
body-parser can be attached to an `app` using the
[`app.extend()`](https://github.com/medleyjs/medley/blob/master/docs/Extensions.md#extend)
method so it can easily be reused in multiple routes.

```js
const medley = require('@medley/medley');
const bodyParser = require('@medley/body-parser');

const app = medley();

app.extend('jsonBodyParser', bodyParser.json({
  rejectUnsupportedTypes: true
}));

app.post('/user', {
  preHandler: app.jsonBodyParser
}, function handler(req, res) {
  // ...
});

app.post('/comment', {
  preHandler: app.jsonBodyParser
}, function handler(req, res) {
  // ...
});
```


[MIME type]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
[`compile-mime-match`]: https://www.npmjs.com/package/compile-mime-match
