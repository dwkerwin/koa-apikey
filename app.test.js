const request = require('supertest');
const Koa = require('koa');
const koaApikey = require('./lib/koa-apikey');
const app = new Koa();
const Router = require('@koa/router');
const router = new Router();

app.use(koaApikey({
        apiKeyServerEnvironmentVariableName: 'REST_API_KEYS',
        unprotectedRoutes: [
            '/v1/health',
            '/v1/login'
        ],
        customHeaderName: 'my-custom-apikey-header',
        useDebugLoggingShowingSecrets: false
}));

router.get('/v1/health', (ctx) => {
    ctx.status = 200;
    ctx.body = "healthy";
});
router.get('/v1/protected', (ctx) => {
    ctx.status = 200;
    ctx.body = "Congratulations! You have the power to access this protected route!";
});

app.use(router.routes()).use(router.allowedMethods());

app.use((ctx) => {
    ctx.body = "Hello World"
});

describe('Test the root path', () => {
    test('It should allow an unprotected route', async () => {
        const response = await request(app.callback()).get('/v1/health');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('healthy');
    });
    test('It should disllow a protected route with a missing apikey', async () => {
        const response = await request(app.callback()).get('/v1/protected');
        expect(response.statusCode).toBe(401);
    });
    test('It should disallow a protected route with an invalid apikey', async () => {
        const response = await request(app.callback()).get('/v1/protected').set('x-apikey', 'invalid');
        expect(response.statusCode).toBe(401);
    });
    test('It should allow a protected route with a valid apikey', async () => {
        process.env.REST_API_KEYS = "abc123";
        const response = await request(app.callback()).get('/v1/protected').set('x-apikey', process.env.REST_API_KEYS);
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Congratulations! You have the power to access this protected route!');
    });
    test('It should allow a protected route with a valid apikey when there are multiple keys', async () => {
        process.env.REST_API_KEYS = "abc123,def456";
        const response = await request(app.callback()).get('/v1/protected').set('x-apikey', process.env.REST_API_KEYS.split(',')[1]);
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Congratulations! You have the power to access this protected route!');
    });
    test('It should allow a protected route with a valid apikey in a custom header', async () => {
        process.env.REST_API_KEYS = "abc123";
        const response = await request(app.callback()).get('/v1/protected').set('my-custom-apikey-header', process.env.REST_API_KEYS);
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Congratulations! You have the power to access this protected route!');
    });
});
