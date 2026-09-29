import test from 'node:test';
import assert from 'node:assert';
import { createTestServer } from './test-harness.js';

test('res.send with default JSON content type', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/json', (req, res) => {
      res.send({ message: 'hello' });
    });

    const result = await request('GET', '/json');

    assert.strictEqual(result.headers['content-type'], 'application/json');
    assert.deepStrictEqual(result.body, { message: 'hello' });
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('res.send with custom HTML content type', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/html', (req, res) => {
      res.send('<h1>Hello World</h1>', 200, 'text/html');
    });

    const result = await request('GET', '/html');

    assert.strictEqual(result.headers['content-type'], 'text/html');
    assert.strictEqual(result.text, '<h1>Hello World</h1>');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('res.send with text/plain content type', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/text', (req, res) => {
      res.send('This is plain text', 200, 'text/plain');
    });

    const result = await request('GET', '/text');

    assert.strictEqual(result.headers['content-type'], 'text/plain');
    assert.strictEqual(result.text, 'This is plain text');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('res.send with custom status code', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/created', (req, res) => {
      res.send({ id: 123 }, 201, 'application/json');
    });

    const result = await request('GET', '/created');

    assert.strictEqual(result.status, 201);
    assert.deepStrictEqual(result.body, { id: 123 });
    assert.strictEqual(result.headers['content-type'], 'application/json');
  } finally {
    await stop();
  }
});

test('res.send with XML content type', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/xml', (req, res) => {
      const xml = '<?xml version="1.0"?><root><item>test</item></root>';
      res.send(xml, 200, 'application/xml');
    });

    const result = await request('GET', '/xml');

    assert.strictEqual(result.headers['content-type'], 'application/xml');
    assert.match(result.text, /<root>/);
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('res.send error responses with custom content type', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/error', (req, res) => {
      res.send('Not Found', 404, 'text/plain');
    });

    const result = await request('GET', '/error');

    assert.strictEqual(result.status, 404);
    assert.strictEqual(result.headers['content-type'], 'text/plain');
    assert.strictEqual(result.text, 'Not Found');
  } finally {
    await stop();
  }
});

test('res.send JSON still works without content type override', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.post('/data', (req, res) => {
      res.send({ created: true }, 201);
    });

    const result = await request('POST', '/data', { test: true });

    assert.strictEqual(result.status, 201);
    assert.strictEqual(result.headers['content-type'], 'application/json');
    assert.deepStrictEqual(result.body, { created: true });
  } finally {
    await stop();
  }
});

test('res.send with numeric status code', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    app.get('/status', (req, res) => {
      res.send('Created', 201, 'text/plain');
    });

    const result = await request('GET', '/status');

    assert.strictEqual(result.status, 201);
    assert.strictEqual(result.text, 'Created');
  } finally {
    await stop();
  }
});
