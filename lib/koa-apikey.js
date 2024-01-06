'use strict';

const debug = require('debug');

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
        const log = debug('koa-apikey');
        log(`API Key from request: ${apiKey}`);
    }
    return apiKey;
}

function getApiKeysFromEnvironment(apiKeyServerEnvironmentVariableName, useDebugLoggingShowingSecrets) {
    const envvarName = apiKeyServerEnvironmentVariableName;
    const apikeys = process.env[envvarName] || '';
    if (useDebugLoggingShowingSecrets) {
        const log = debug('koa-apikey');
        log(`API Keys from environment: ${apikeys}`);
    }
    return apikeys.split(',').filter(Boolean);
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
                    const logError = debug('koa-apikey:error');
                    logError(`Invalid API Key passed: ${apikeyFromRequest}`);
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