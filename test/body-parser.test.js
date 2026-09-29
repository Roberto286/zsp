import test from 'node:test';
import assert from 'node:assert';
import { createTestServer } from './test-harness.js';

test('GET requests do not parse body', async (t) => {
  const { app, start, stop, request } = createTestServer();
  
  await start();
  
  try {
    let capturedBody = 'NOT_SET';
    app.get('/data', (req, res) => {
      capturedBody = req.body;
      res.send({ body: req.body });
    });

    // GET request should not have body parsed (even with JSON content type)
    const result = await request('GET', '/data?test=1', null, {
      'Content-Type': 'application/json'
    });
    
    assert.strictEqual(capturedBody, undefined, 'GET request body should be undefined');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('DELETE requests do not parse body', async (t) => {
  const { app, start, stop, request } = createTestServer();
  
  await start();
  
  try {
    let capturedBody = 'NOT_SET';
    app.delete('/items/:id', (req, res) => {
      capturedBody = req.body;
      res.send({ body: req.body });
    });

    const result = await request('DELETE', '/items/123');
    
    assert.strictEqual(capturedBody, undefined, 'DELETE request body should be undefined');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Non-JSON Content-Type does not parse JSON', async (t) => {
  const { app, start, stop, request } = createTestServer();
  
  await start();
  
  try {
    let capturedBody = 'NOT_SET';
    app.post('/text', (req, res) => {
      capturedBody = req.body;
      res.send({ body: req.body });
    });

    const result = await request('POST', '/text', 'plain text content', {
      'Content-Type': 'text/plain'
    });
    
    assert.strictEqual(capturedBody, undefined, 'text/plain body should not be parsed as JSON');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('JSON Content-Type body is parsed', async (t) => {
  const { app, start, stop, request } = createTestServer();
  
  await start();
  
  try {
    let capturedBody = null;
    app.post('/data', (req, res) => {
      capturedBody = req.body;
      res.send({ body: req.body });
    });

    const testData = { name: 'Alice', value: 42 };
    const result = await request('POST', '/data', testData);
    
    assert.deepStrictEqual(capturedBody, testData, 'JSON body should be parsed');
    assert.deepStrictEqual(result.body.body, testData);
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Missing Content-Type does not parse body', async (t) => {
  const { app, start, stop, request } = createTestServer();
  
  await start();
  
  try {
    let capturedBody = 'NOT_SET';
    app.post('/data', (req, res) => {
      capturedBody = req.body;
      res.send({ body: req.body });
    });

    // Explicitly remove Content-Type header
    const result = await request('POST', '/data', '{"test": true}', {
      'Content-Type': ''
    });
    
    assert.strictEqual(capturedBody, undefined, 'body without JSON Content-Type should not be parsed');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('charset parameter in Content-Type is accepted', async (t) => {
  const { app, start, stop, request } = createTestServer();
  
  await start();
  
  try {
    let capturedBody = null;
    app.post('/data', (req, res) => {
      capturedBody = req.body;
      res.send({ parsed: true });
    });

    const testData = { key: 'value' };
    const result = await request('POST', '/data', testData, {
      'Content-Type': 'application/json; charset=utf-8'
    });
    
    assert.deepStrictEqual(capturedBody, testData, 'JSON with charset should be parsed');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});
