'use strict';

function findApiKeyFromRequest(headers, query, customHeaderName) {
    if (!headers) headers = {};
    if (!query) query = {};

    return headers[customHeaderName]
    || headers['x-apikey']
    || headers['x-api-key']
    || headers['apikey']
    || query['api-key']
    || query['apikey']
}

function getApiKeysFromEnvironment(apiKeyServerEnvironmentVariableName) {
    const envvarName = apiKeyServerEnvironmentVariableName;
    const apikeys = process.env[envvarName] || '';
    return apikeys.split(',').filter(Boolean);
}

const koaApikey = function (options = {}) {
    const defaultOptions = {
        apiKeyServerEnvironmentVariableName: 'REST_API_KEYS',
        unprotectedRoutes: [],
        customHeaderName: null
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
            const apikeyFromRequest = findApiKeyFromRequest(ctx.request.headers, ctx.request.query, options.customHeaderName);
            const apiKeysFromEnvironment = getApiKeysFromEnvironment(options.apiKeyServerEnvironmentVariableName);
            ctx.assert(apiKeysFromEnvironment.includes(apikeyFromRequest), 401);
        }
        await next();
    };
    middleware._name = 'koa-apikey';
    return middleware;
};

module.exports = koaApikey;