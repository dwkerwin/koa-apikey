# koa-apikey

A simple API Key authorization middleware handler for [koa](https://koajs.com/).  Useful to apply simple API Key authentication on a Koa REST Service where a small fixed number of API Keys are used.

## Installation

Via npm:

```shell
npm install koa-apikey --save
```

## Usage

```javascript
"use strict";

const Koa = require("koa");
const koaApikey = require("koa-apikey");
const app = new Koa();

app.use(koaApikey({
    // specifies the server system environment variable which will contain
    // the comma separated list of API keys
    apiKeyServerEnvironmentVariableName: 'REST_API_KEYS',
    // don't enforce API key authentication on these routes
    unprotectedRoutes: [
      '/v1/health',
      '/v1/login'
    ],
    // specify a custom header name for the API key
    // headers must be lower case and can use dashes but not underscores
    customHeaderName: 'my-custom-apikey-header',
    // if you need to TEMPORARILY turn on debug logging, which would show
    // the API keys in the environment and those that are passed, set to true
    // also execute with DEBUG=koa-apikey node index.js to see output
    useDebugLoggingShowingSecrets: false
}));

app.use((ctx) => {
  ctx.body = "Hello World"
});

app.listen(3000);
```

Example

```shell
# in a terminal
export REST_API_KEYS="aaabbbccc123,someotherkey123"
node index.js
# or to run with debug output: DEBUG=koa-apikey node index.js

# in another submit a request
curl -v http://localhost:3000/
# no API Key present, yields a HTTP 401

curl -v --header "x-apikey: aaabbbccc123" http://localhost:3000/
# yields HTTP 200

# koa-apikey will also look for the apikey on the querystring if not provided in the header
curl -v http://localhost:3000/?apikey=aaabbbccc123
# yields HTTP 200
```

## Usage with AWS SSM Parameter Store

```shell
# store the API keys in AWS SSM Parameter store as encrypted strings
aws ssm put-parameter \
    --name "/dev/my-rest-service/REST_API_KEYS" \
    --value "aaabbbccc123,someotherkey,yetanotherkey987" \
    --type SecureString

# ssm-starter will load the previously saved SSM parameter from AWS into the
# local system environment and then start your Koa service which will be able
# to read it.
pip install ssm-starter
ssm-starter \
    --ssm-name /dev/my-rest-service/ \
    --command node index.js
```

## Testing

```shell
npx jest
```

Or run tests with debug output on for koa* labeled logs:
```shell
LOG_LEVEL=debug npx jest
``````
