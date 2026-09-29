import test from 'node:test';
import assert from 'node:assert';
import { createTestServer } from './test-harness.js';

test('Array fields not treated as nested objects', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    // Class-based schema with array field
    class Post {
      title = '';
      tags = [];
    }

    let validationPassed = false;
    app.post('/posts', (req, res) => {
      validationPassed = true;
      res.send({ success: true });
    }, { schema: Post });

    // Valid array should pass validation
    const result = await request('POST', '/posts', {
      title: 'Test',
      tags: ['javascript', 'nodejs']
    });

    assert.strictEqual(validationPassed, true, 'validation should pass for valid array');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Array element type validation', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    class Post {
      tags = [''];
    }

    app.post('/posts', (req, res) => {
      res.send({ success: true });
    }, { schema: Post });

    // Valid array of strings
    const validResult = await request('POST', '/posts', { tags: ['a', 'b', 'c'] });
    assert.strictEqual(validResult.status, 200);

    // Invalid array with numbers instead of strings
    const invalidResult = await request('POST', '/posts', { tags: [1, 2, 3] });
    assert.strictEqual(invalidResult.status, 400, 'array with wrong element type should fail validation');
  } finally {
    await stop();
  }
});

test('Mixed type array elements rejected', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    class Item {
      ids = [0];
    }

    app.post('/items', (req, res) => {
      res.send({ success: true });
    }, { schema: Item });

    // Numbers array should work
    const numResult = await request('POST', '/items', { ids: [1, 2, 3] });
    assert.strictEqual(numResult.status, 200);

    // Mixed types should fail
    const mixedResult = await request('POST', '/items', { ids: [1, 'two', 3] });
    assert.strictEqual(mixedResult.status, 400, 'mixed type array should fail validation');
  } finally {
    await stop();
  }
});

test('Extra fields rejected in strict mode', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    class User {
      name = '';
      email = '';
    }

    app.post('/users', (req, res) => {
      res.send({ success: true });
    }, { schema: User });

    // Valid body with only expected fields
    const validResult = await request('POST', '/users', {
      name: 'Alice',
      email: 'alice@example.com'
    });
    assert.strictEqual(validResult.status, 200);

    // Body with extra fields should fail
    const invalidResult = await request('POST', '/users', {
      name: 'Bob',
      email: 'bob@example.com',
      password: 'secret123',
      isAdmin: true
    });
    assert.strictEqual(invalidResult.status, 400, 'extra fields should cause validation failure');
  } finally {
    await stop();
  }
});

test('Missing required fields rejected', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    class Product {
      name = '';
      price = 0;
    }

    app.post('/products', (req, res) => {
      res.send({ success: true });
    }, { schema: Product });

    // Missing 'price' field should fail
    const result = await request('POST', '/products', { name: 'Widget' });
    assert.strictEqual(result.status, 400, 'missing required field should fail validation');
  } finally {
    await stop();
  }
});

test('Plain-object schema support (plain object literal)', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    // Plain object schema (as documented in README)
    const schema = {
      name: 'string',
      email: 'string',
      age: 'number'
    };

    let validationPassed = false;
    app.post('/register', (req, res) => {
      validationPassed = true;
      res.send({ success: true });
    }, { schema: schema });

    // Valid data should pass
    const result = await request('POST', '/register', {
      name: 'Alice',
      email: 'alice@example.com',
      age: 30
    });

    assert.strictEqual(validationPassed, true, 'plain-object schema validation should pass');
    assert.strictEqual(result.status, 200);
  } finally {
    await stop();
  }
});

test('Plain-object schema type checking', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    const schema = {
      name: 'string',
      count: 'number'
    };

    app.post('/data', (req, res) => {
      res.send({ success: true });
    }, { schema: schema });

    // Valid types
    const validResult = await request('POST', '/data', {
      name: 'test',
      count: 42
    });
    assert.strictEqual(validResult.status, 200);

    // Wrong type should fail
    const invalidResult = await request('POST', '/data', {
      name: 'test',
      count: 'not-a-number'
    });
    assert.strictEqual(invalidResult.status, 400, 'wrong type in plain-object schema should fail');
  } finally {
    await stop();
  }
});

test('Plain-object schema with arrays', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    // Note: For plain-object schemas, we need to indicate array with an instance
    // The validator infers array type from the shape
    const schema = {
      name: 'string',
      tags: []  // Empty array means array field
    };

    app.post('/posts', (req, res) => {
      res.send({ success: true });
    }, { schema: schema });

    // Valid array of strings
    const validResult = await request('POST', '/posts', {
      name: 'My Post',
      tags: ['javascript', 'nodejs']
    });
    assert.strictEqual(validResult.status, 200);

    // Non-array value should fail
    const invalidResult = await request('POST', '/posts', {
      name: 'My Post',
      tags: 'not-an-array'
    });
    assert.strictEqual(invalidResult.status, 400, 'non-array value for array field should fail');
  } finally {
    await stop();
  }
});

test('Plain-object schema rejects extra fields', async (t) => {
  const { app, start, stop, request } = createTestServer();

  await start();

  try {
    const schema = {
      username: 'string',
      email: 'string'
    };

    app.post('/auth', (req, res) => {
      res.send({ success: true });
    }, { schema: schema });

    // Valid request
    const validResult = await request('POST', '/auth', {
      username: 'alice',
      email: 'alice@example.com'
    });
    assert.strictEqual(validResult.status, 200);

    // Extra fields should fail
    const invalidResult = await request('POST', '/auth', {
      username: 'bob',
      email: 'bob@example.com',
      password: 'secret'
    });
    assert.strictEqual(invalidResult.status, 400, 'plain-object schema should reject extra fields');
  } finally {
    await stop();
  }
});
