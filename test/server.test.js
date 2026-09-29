import test from 'node:test';
import assert from 'node:assert';
import { createTestServer } from './test-harness.js';

test('CORS disabled by default', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/data', (req, res) => {
      res.send({ message: 'hello' });
    });

    const result = await request('GET', '/data');

    // CORS headers should not be present by default
    assert.strictEqual(result.headers['access-control-allow-origin'], undefined);
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('CORS enabled with default options', async (t) => {
  const { app, start, stop, request } = createTestServer();

  app.enableCors();
  await start();

  try {
    app.get('/data', (req, res) => {
      res.send({ message: 'hello' });
    });

    const result = await request('GET', '/data');

    assert.strictEqual(result.headers['access-control-allow-origin'], '*');
    assert.strictEqual(result.headers['access-control-allow-methods'], 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    assert.strictEqual(result.headers['access-control-allow-headers'], 'Content-Type');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('CORS with custom origin', async (t) => {
  const { app, start, stop, request } = createTestServer();

  app.enableCors({ origin: 'https://example.com' });
  await start();

  try {
    app.get('/data', (req, res) => {
      res.send({ message: 'hello' });
    });

    const result = await request('GET', '/data');

    assert.strictEqual(result.headers['access-control-allow-origin'], 'https://example.com');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('CORS with custom methods', async (t) => {
  const { app, start, stop, request } = createTestServer();

  app.enableCors({ methods: 'GET,POST' });
  await start();

  try {
    app.get('/data', (req, res) => {
      res.send({ message: 'hello' });
    });

    const result = await request('GET', '/data');

    assert.strictEqual(result.headers['access-control-allow-methods'], 'GET,POST');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('CORS with custom headers', async (t) => {
  const { app, start, stop, request } = createTestServer();

  app.enableCors({ headers: 'Content-Type, Authorization' });
  await start();

  try {
    app.get('/data', (req, res) => {
      res.send({ message: 'hello' });
    });

    const result = await request('GET', '/data');

    assert.strictEqual(result.headers['access-control-allow-headers'], 'Content-Type, Authorization');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Production error is generic (NODE_ENV not development)', async (t) => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/error', (req, res) => {
      throw new Error('Something went wrong');
    });

    const result = await request('GET', '/error');

    assert.strictEqual(result.status, 500);
    // In production, should not expose stack trace
    assert.strictEqual(typeof result.body, 'string');
    assert.match(result.text, /Internal server error/i);
    assert.strictEqual(result.text.includes('stack'), false);
  } finally {
    process.env.NODE_ENV = originalEnv;
    await stop();
  }
});

test('Development error includes stack and message', async (t) => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/error', (req, res) => {
      throw new Error('Development error message');
    });

    const result = await request('GET', '/error');

    assert.strictEqual(result.status, 500);
    assert.strictEqual(typeof result.body, 'object');
    assert.strictEqual(result.body.message, 'Development error message');
    assert.strictEqual(typeof result.body.stack, 'string');
    assert.match(result.body.stack, /Development error message/);
  } finally {
    process.env.NODE_ENV = originalEnv;
    await stop();
  }
});

test('app.use registers middleware', async (t) => {
  const { app, start, stop, request } = createTestServer();

  let middlewareCalled = false;
  app.use((req, res, next) => {
    middlewareCalled = true;
    next();
  });

  await start();

  try {
    app.get('/test', (req, res) => {
      res.send({ middleware: middlewareCalled });
    });

    const result = await request('GET', '/test');

    assert.strictEqual(middlewareCalled, true, 'middleware should be called');
    assert.deepStrictEqual(result.body, { middleware: true });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Middleware can modify request', async (t) => {
  const { app, start, stop, request } = createTestServer();

  app.use((req, res, next) => {
    req.custom = 'middleware-value';
    next();
  });

  await start();

  try {
    let capturedCustom = null;
    app.get('/test', (req, res) => {
      capturedCustom = req.custom;
      res.send({ custom: req.custom });
    });

    const result = await request('GET', '/test');

    assert.strictEqual(capturedCustom, 'middleware-value');
    assert.deepStrictEqual(result.body, { custom: 'middleware-value' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Multiple middleware execute in order', async (t) => {
  const { app, start, stop, request } = createTestServer();

  const order = [];

  app.use((req, res, next) => {
    order.push(1);
    next();
  });

  app.use((req, res, next) => {
    order.push(2);
    next();
  });

  app.use((req, res, next) => {
    order.push(3);
    next();
  });

  await start();

  try {
    app.get('/test', (req, res) => {
      res.send({ order });
    });

    const result = await request('GET', '/test');

    assert.deepStrictEqual(order, [1, 2, 3], 'middleware should execute in order');
    assert.deepStrictEqual(result.body.order, [1, 2, 3]);
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Middleware without next() halts chain', async (t) => {
  const { app, start, stop, request } = createTestServer();

  let handlerCalled = false;

  app.use((req, res, next) => {
    res.send({ middleware: 'blocked' });
    // Intentionally NOT calling next()
  });

  await start();

  try {
    app.get('/test', (req, res) => {
      handlerCalled = true;
      res.send({ handler: 'should-not-reach' });
    });

    const result = await request('GET', '/test');

    assert.strictEqual(handlerCalled, false, 'handler should not be called if middleware stops');
    assert.deepStrictEqual(result.body, { middleware: 'blocked' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Middleware executes before route handlers', async (t) => {
  const { app, start, stop, request } = createTestServer();

  const order = [];

  app.use((req, res, next) => {
    order.push('middleware');
    next();
  });

  await start();

  try {
    app.get('/test', (req, res) => {
      order.push('handler');
      res.send({ order });
    });

    const result = await request('GET', '/test');

    assert.deepStrictEqual(order, ['middleware', 'handler']);
    assert.deepStrictEqual(result.body.order, ['middleware', 'handler']);
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('app.use returns app for chaining', async (t) => {
  const { app, start, stop, request } = createTestServer();

  const result = app.use((req, res, next) => next());

  assert.strictEqual(result, app, 'app.use should return app for chaining');

  await start();
  try {
    app.get('/test', (req, res) => {
      res.send({ ok: true });
    });

    const httpResult = await request('GET', '/test');
    assert.strictEqual(httpResult.status, 200);
  } finally {
    await stop();
  }
});
