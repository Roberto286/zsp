import { Server } from "http";
import { Router } from "./router.js";
import { HttpMethods } from "../../enums/http-methods.enum.js";
import { parseBody } from "./body-parser.js";
import { enhanceResponse } from "./response-enhancer.js";
import { validateSchema } from "./schema-validator.js";

class CustomServer extends Server {
  static #instance = null;
  #middlewares = [];
  #corsEnabled = false;
  #corsOptions = {};


  constructor() {
    super();
    this.#registerHttpMethods();
    this.on("request", this.#handleRequest.bind(this));
    CustomServer.#instance = this;
  }

  async #handleRequest(req, res) {
    try {
      await this.#applyMiddlewares(req, res);
      const { handler, options = {} } = Router.findRoute(req) || {};
      const { schema } = options;

      if (schema && !validateSchema(req.body, schema)) {
        return this.#sendBadRequest(res);
      }

      if (handler) {
        await handler(req, res);
      } else {
        this.#sendNotFound(res);
      }
    } catch (error) {
      this.#handleError(error, res);
    }
  }

  async #applyMiddlewares(req, res) {
    enhanceResponse(res);
    req.body = await parseBody(req);
    
    // Apply CORS headers if enabled
    if (this.#corsEnabled) {
      res.setHeader('Access-Control-Allow-Origin', this.#corsOptions.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', this.#corsOptions.methods || 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', this.#corsOptions.headers || 'Content-Type');
    }
    
    // Execute user-registered middleware chain
    for (const middleware of this.#middlewares) {
      let nextCalled = false;
      await new Promise((resolve, reject) => {
        try {
          middleware(req, res, () => {
            nextCalled = true;
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
      // If middleware didn't call next(), halt the chain
      if (!nextCalled) {
        break;
      }
    }
  }

  use(fn) {
    this.#middlewares.push(fn);
    return this;
  }
  enableCors(options = {}) {
    this.#corsEnabled = true;
    this.#corsOptions = options;
    return this;
  }


  #registerHttpMethods() {
    Object.values(HttpMethods).forEach((method) => {
      this[method.toLowerCase()] = (path, handler, schema) => {
        Router.register(path, method, handler, schema);
      };
    });
  }

  #sendNotFound(res) {
    res.send("Resource not found", 404);
  }

  #handleError(error, res) {
    console.error(error);
    if (process.env.NODE_ENV === 'development') {
      res.send({ 
        error: "Internal server error", 
        message: error.message,
        stack: error.stack 
      }, 500);
    } else {
      res.send("Internal server error", 500);
    }
  }

  #sendBadRequest(res) {
    res.send("Bad request", 400);
  }

  static getInstance() {
    return CustomServer.#instance || new CustomServer();
  }

  listen(...args) {
    super.listen(...args)
  }
}

export const getServer = CustomServer.getInstance;
