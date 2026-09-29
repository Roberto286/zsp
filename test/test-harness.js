import { getServer } from '../src/main.js';
import { resetServer } from '../src/lib/network/server.js';

// Create test server and make HTTP requests
export const createTestServer = () => {
  resetServer();
  const app = getServer();
  let server = null;

  return {
    app,
    async start(port = 0) {
      return new Promise((resolve, reject) => {
        server = app.listen(port, () => {
          const actualPort = server.address().port;
          resolve(actualPort);
        }).on('error', reject);
      });
    },
    async stop() {
      if (server) {
        return new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    },
    async request(method, path, body = null, headers = {}) {
      if (!server) throw new Error('Server not started');

      const port = server.address().port;
      const url = new URL(`http://localhost:${port}${path}`);
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      const options = {
        method,
        headers: defaultHeaders
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: data,
        text
      };
    }
  };
};
