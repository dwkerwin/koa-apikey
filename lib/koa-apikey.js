'use strict';

const logger = require('./logger');

// returns a redacted version of the secret string with only the first and
// last 4 characters visible
function redactSecretString(secret) {
    if (!secret) {
        return "(empty string)";
    }
    if (secret.length < 8) {
        return secret;
    }
    const start = secret.substring(0, 4);
    const end = secret.substring(secret.length - 4);
    const redactedSecret = start + secret.substring(4, secret.length - 4).replace(/./g, '*') + end;
    return redactedSecret;
}

function findApiKeyFromRequest(headers, query, customHeaderName, useDebugLoggingShowingSecrets) {
    if (!headers) headers = {};
    if (!query) query = {};

    const apiKey = headers[customHeaderName]
    || headers['x-apikey']
    || headers['x-api-key']
    || headers['apikey']
    || query['api-key']
    || query['apikey']

    if (useDebugLoggingShowingSecrets) {
        logger.debug(`API Key from request: ${redactSecretString(apiKey)}`);
    }
    return apiKey;
}

function getApiKeysFromEnvironment(apiKeyServerEnvironmentVariableName, useDebugLoggingShowingSecrets) {
    const envvarName = apiKeyServerEnvironmentVariableName;
    const apikeysCsv = process.env[envvarName] || '';
    const apikeys = apikeysCsv.split(',').filter(Boolean);
    if (useDebugLoggingShowingSecrets) {
        apikeys.forEach(apikey => {
            const redactedApikey = redactSecretString(apikey);
            logger.debug(`API Key from environment: ${redactedApikey}`);
        });
    }
    return apikeys;
}

const koaApikey = function (options = {}) {
    const defaultOptions = {
        apiKeyServerEnvironmentVariableName: 'REST_API_KEYS',
        unprotectedRoutes: [],
        customHeaderName: null,
        useDebugLoggingShowingSecrets: false
    };
    options = Object.assign({}, defaultOptions, options);

    const middleware = async (ctx, next) => {
        let isUnprotectedRoute = false;
        if (options.unprotectedRoutes) {
            const pathWithoutQuerystring = ctx.request.url.split('?')[0]
            for (let unprotectedRoute of options.unprotectedRoutes) {
                if (pathWithoutQuerystring == unprotectedRoute) {
                    isUnprotectedRoute = true;
                    break;
                }
            }
        }
        if (!isUnprotectedRoute) {
            const apikeyFromRequest = findApiKeyFromRequest(ctx.request.headers, ctx.request.query, options.customHeaderName, options.useDebugLoggingShowingSecrets);
            const apiKeysFromEnvironment = getApiKeysFromEnvironment(options.apiKeyServerEnvironmentVariableName, options.useDebugLoggingShowingSecrets);
            if (!apiKeysFromEnvironment.includes(apikeyFromRequest)) {
                if (options.useDebugLoggingShowingSecrets) {
                    logger.error(`Invalid API Key passed: ${apikeyFromRequest}`);
                }
                ctx.assert(false, 401);
            }
        }
        await next();
    };
    middleware._name = 'koa-apikey';
    return middleware;
};

module.exports = koaApikey;