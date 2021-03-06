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
    // specifies the server system environment variable which will container
    // the comma separated list of API keys
    apiKeyServerEnvironmentVariableName: 'REST_API_KEYS',
    // don't enforce API key authentication on these routes
    unprotectedRoutes: [
      '/v1/health',
      '/v1/login'
    ]
}
));

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
