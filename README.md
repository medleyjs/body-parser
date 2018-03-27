# @medley/body-parser

[![npm Version](https://img.shields.io/npm/v/@medley/body-parser.svg)](https://www.npmjs.com/package/@medley/body-parser)
[![Build Status](https://travis-ci.org/medleyjs/body-parser.svg?branch=master)](https://travis-ci.org/medleyjs/body-parser)
[![Coverage Status](https://coveralls.io/repos/github/medleyjs/body-parser/badge.svg?branch=master)](https://coveralls.io/github/medleyjs/body-parser?branch=master)
[![dependencies Status](https://david-dm.org/medleyjs/body-parser/status.svg)](https://david-dm.org/medleyjs/body-parser)

Essential body parsers for [Medley](https://github.com/medleyjs/medley).

This module provides the following parsers:

+ [JSON body parser](#bodyparserjsonoptions)
+ [Text body parser](#bodyparsertextoptions)
+ [URL-encoded body parser](#bodyparserurlencodedoptions)
+ [Buffer body parser](#bodyparserbufferoptions)

## Installation

```sh
# npm
npm install @medley/body-parser --save

# yarn
yarn add @medley/body-parser
```

## API

```js
const bodyParser = require('@medley/body-parser');
```

The `bodyParser` object exposes various factory functions that create a body-parsing
function that should be passed as the second argument to Medley's
[`app.addBodyParser()`](https://github.com/medleyjs/medley/blob/master/docs/BodyParser.md#appaddbodyparser)
method. All factory functions take an `options` object for configuration.

The following describes each of the available factory functions.

---

### `bodyParser.json([options])`

Parses request bodies as JSON using
[`JSON.parse()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse).

```js
const bodyParser = require('@medley/body-parser');
const medley = require('@medley/medley');
const app = medley();

app.addBodyParser('application/json', bodyParser.json());
```

#### Options

##### limit

+ *number*
+ Default: `1048576` (1 MiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.json({limit: 100000})
```

---

### `bodyParser.text([options])`

Parses request bodies into a *string*.

```js
const bodyParser = require('@medley/body-parser');
const medley = require('@medley/medley');
const app = medley();

app.addBodyParser('text/plain', bodyParser.text());
// or
app.addBodyParser('text/*', bodyParser.text());
```

#### Options

##### limit

+ *number*
+ Default: `1048576` (1 MiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.text({limit: 100000})
```

---

### `bodyParser.urlEncoded([options])`

Parses URL-encoded request bodies into an *object*.

```js
const bodyParser = require('@medley/body-parser');
const medley = require('@medley/medley');
const app = medley();

app.addBodyParser('application/x-www-form-urlencoded', bodyParser.urlEncoded());
```

#### Options

##### limit

+ *number*
+ Default: `1048576` (1 MiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.urlEncoded({limit: 100000})
```

##### parser

+ *function*
+ Default: [`querystring.parse`](https://nodejs.org/api/querystring.html#querystring_querystring_parse_str_sep_eq_options)

Specifies the function that will parse the request body as a string into an object. This can be used
as a way to call `querystring.parse()` with options.

```js
const querystring = require('querystring');

function customParser(body) {
  return querystring.parse(body, null, null, {maxKeys: 20});
}

bodyParser.urlEncoded({parser: customParser})
```

---

### `bodyParser.buffer([options])`

Parses request bodies into a `Buffer`.

```js
const bodyParser = require('@medley/body-parser');
const medley = require('@medley/medley');
const app = medley();

app.addBodyParser('application/octet-stream', bodyParser.buffer());
// or to catch all requests
app.addBodyParser('*/*', bodyParser.buffer());
```

#### Options

##### limit

+ *number*
+ Default: `1048576` (1 MiB)

Specifies the maximum acceptable request body size.

```js
bodyParser.buffer({limit: 100000})
```
