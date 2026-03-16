import { Server } from "http";
import { Router } from "./router.js";
import { HttpMethods } from "../../enums/http-methods.enum.js";
import { parseBody } from "./body-parser.js";
import { enhanceResponse } from "./response-enhancer.js";
import { validateSchema } from "./schema-validator.js";

class CustomServer extends Server {
  static #instance = null;

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
    res.send("Internal server error", 500);
  }

  #sendBadRequest(res) {
    res.send("Bad request", 400);
  }

  static getInstance() {
    return CustomServer.#instance || new CustomServer();
  }
}

export const getServer = CustomServer.getInstance;
