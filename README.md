# ZSP

## The express-like framework with zero dependencies. Yes, you read that right. ZERO

```text
███████████  █████████  ███████████ 
▒█▒▒▒▒▒▒███  ███▒▒▒▒▒███▒▒███▒▒▒▒▒███
▒     ███▒  ▒███    ▒▒▒  ▒███    ▒███
     ███    ▒▒█████████  ▒██████████ 
    ███      ▒▒▒▒▒▒▒▒███ ▒███▒▒▒▒▒▒  
  ████     █ ███    ▒███ ▒███        
 ███████████▒▒█████████  █████       
▒▒▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒     
       ZSP - Zero Spaccato
```

## ⚠️ Development Status

> **ZSP is under active development.** It is not intended for production use. Expect breaking changes, missing features, and occasional chaos.

This is a proof-of-concept. A rebellion. A statement.

---

## What's in a name?

**ZSP** stands for **"Zero Spaccato"** — an Italian phrase that literally translates to **"absolute zero"**.

Why? Because this framework has:

- **Zero dependencies**
- **Zero node_modules**
- **Zero headaches**

That's right. No `npm install` will ever download a forest's worth of packages just to handle a simple HTTP request. Just you, JavaScript, and the Node.js built-in `http` module. That's it. That's the whole thing.

## Installation

```bash
npm install @roberto286/zsp
```

That's it. No `npm ci`. No waiting for 847 packages to install. Just pure, beautiful JavaScript.

## Quick Start

```javascript
import { getServer } from '@roberto286/zsp';

const app = getServer();

app.get('/', (req, res) => {
  res.send({ message: 'Hello, World!' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

Run it with:

```bash
node your-file.js
```

That's it. You're running a web server. Go ahead, pinch yourself.

## Features

- **Zero dependencies** — Seriously, we can't say it enough
- **Express-like API** — If you know Express, you know ZSP
- **HTTP methods** — GET, POST, PUT, DELETE, PATCH
- **URL parameters** — Capture dynamic segments like a pro
- **JSON body parsing** — Automatic because you're not a savage
- **Schema validation** — Validate incoming data without the bloat
- **Tiny footprint** — Smaller than your morning coffee's carbon footprint

## Usage Examples

### Basic Routes

```javascript
app.get('/users', (req, res) => {
  res.send({ users: ['alice', 'bob', 'charlie'] });
});

app.post('/users', (req, res) => {
  const newUser = req.body;
  res.status(201).send({ created: newUser });
});

app.put('/users/:id', (req, res) => {
  res.send({ updated: req.params.id, data: req.body });
});

app.delete('/users/:id', (req, res) => {
  res.status(204).send();
});
```

### URL Parameters

```javascript
app.get('/users/:id', (req, res) => {
  res.send({ userId: req.params.id });
});

app.get('/posts/:postId/comments/:commentId', (req, res) => {
  res.send({
    postId: req.params.postId,
    commentId: req.params.commentId
  });
});
```

### Schema Validation

```javascript
app.post('/register', (req, res) => {
  res.send({ welcome: req.body.name });
}, {
  schema: {
    name: 'string',
    email: 'string',
    age: 'number'
  }
});
```

If the request body doesn't match the schema, ZSP will respond with a `400 Bad Request`. You're welcome.

### Response Helpers

```javascript
app.get('/ok', (req, res) => {
  res.send({ status: 'ok' });
});

app.get('/created', (req, res) => {
  res.status(201).send({ created: true });
});

app.get('/no-content', (req, res) => {
  res.status(204).send();
});

app.get('/custom', (req, res) => {
  res.send('Custom message', 418); // I'm a teapot 🫖
});
```

## Why Zero Dependencies?

Because `node_modules` shouldn't be a lifestyle choice.

Every time you `npm install`, you're trusting thousands of maintainers to keep their packages secure, updated, and bug-free. That's... a lot of faith.

ZSP says: "What if we just didn't?"

Here's the thing: **you don't need 847 packages to build a web server.** You never did.

This framework proves it. Every route, every body parser, every response helper — all built from scratch using nothing but JavaScript and Node.js native modules. No external packages. No dependencies. No excuses.

You get:

- **Blazing fast installs** — No more waiting for CI/CD pipelines
- **Smaller bundles** — Deploy in seconds, not minutes
- **Security** — Less surface area, less worry
- **Learning** — Actually understand what your code does
- **Independence** — Build things YOUR way

## What's Next?

ZSP is tiny but mighty. It handles routing, parameters, body parsing, and schema validation. More features might come, but they'll always be optional.

This is for developers who want to build things, not read documentation about dependencies.

---

## The Point

You don't need a thousand dependencies to build something useful.

This framework exists to prove that point. To show that with a little creativity and the native Node.js modules, you can create something functional without relying on the npm ecosystem for everything.

ZSP isn't trying to replace Express or Fastify. It's trying to show you what's possible when you strip away the bloat.

Go ahead. Build something. Prove it to yourself.

---

## License

GPL-3.0-only — Free as in freedom.

---

Built with 💯 and zero dependencies by [Roberto Saliola](https://github.com/Roberto286)
