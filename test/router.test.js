import test from 'node:test';
import assert from 'node:assert';
import { createTestServer } from './test-harness.js';

test('URL params extracted correctly', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    let capturedParams = null;
    app.get('/users/:id', (req, res) => {
      capturedParams = req.params;
      res.send({ params: req.params });
    });

    const result = await request('GET', '/users/123');

    assert.deepStrictEqual(capturedParams, { id: '123' }, 'params should be {id: "123"}');
    assert.deepStrictEqual(result.body.params, { id: '123' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Multiple URL params extracted', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    let capturedParams = null;
    app.get('/users/:userId/posts/:postId', (req, res) => {
      capturedParams = req.params;
      res.send({ params: req.params });
    });

    const result = await request('GET', '/users/42/posts/999');

    assert.deepStrictEqual(capturedParams, { userId: '42', postId: '999' });
    assert.deepStrictEqual(result.body.params, { userId: '42', postId: '999' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Query string populated from URL', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    let capturedQuery = null;
    app.get('/users', (req, res) => {
      capturedQuery = req.query;
      res.send({ query: req.query });
    });

    const result = await request('GET', '/users?active=true&page=2');

    assert.deepStrictEqual(capturedQuery, { active: 'true', page: '2' });
    assert.deepStrictEqual(result.body.query, { active: 'true', page: '2' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Query string with multiple values', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    let capturedQuery = null;
    app.get('/search', (req, res) => {
      capturedQuery = req.query;
      res.send({ query: req.query });
    });

    const result = await request('GET', '/search?q=test&sort=name&limit=10');

    assert.deepStrictEqual(capturedQuery, { q: 'test', sort: 'name', limit: '10' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Duplicate route registration warns', async (t) => {
  const { app, start, stop, request } = createTestServer();

  const originalWarn = console.warn;
  let warnCalled = false;
  let warnMessage = '';

  console.warn = (msg) => {
    warnCalled = true;
    warnMessage = msg;
  };

  try {
    await start();

    const handler1 = (req, res) => res.send({ handler: 1 });
    const handler2 = (req, res) => res.send({ handler: 2 });

    app.get('/test', handler1);
    app.get('/test', handler2); // Should warn about duplicate

    assert.strictEqual(warnCalled, true, 'console.warn should be called');
    assert.match(warnMessage, /already registered/i, 'warning should mention duplicate registration');

    const result = await request('GET', '/test');
    // Should use handler2 (overwritten)
    assert.strictEqual(result.body.handler, 2);
  } finally {
    console.warn = originalWarn;
    await stop();
  }
});

test('Exact-match routing - partial path does not match', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/users/:id', (req, res) => {
      res.send({ matched: true, params: req.params });
    });

    // Exact path should match
    const exactResult = await request('GET', '/users/123');
    assert.strictEqual(exactResult.status, 200);
    assert.deepStrictEqual(exactResult.body.params, { id: '123' });

    // Extra path segments should NOT match (should 404)
    const partialResult = await request('GET', '/users/123/extra/path');
    assert.strictEqual(partialResult.status, 404, 'partial/extra path should not match route');
  } finally {
    await stop();
  }
});

test('Different route methods do not cross-match', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/test', (req, res) => {
      res.send({ method: 'GET' });
    });

    const getResult = await request('GET', '/test');
    assert.strictEqual(getResult.status, 200);

    const postResult = await request('POST', '/test');
    assert.strictEqual(postResult.status, 404, 'POST should not match GET route');
  } finally {
    await stop();
  }
});
