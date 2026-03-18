import * as url from "node:url";

export class Router {
  static routes = new Map();

  static register(path, method, handler, options) {
    const parts = path.split("/").filter(Boolean);
    const params = Router.extractParams(path);
    const regex = new RegExp(
      "^" +
        parts
          .map((part) => (part.startsWith(":") ? "([^/]+)" : part))
          .join("/") +
        "$",
    );

    Router.routes.set(`${method}:${path}`, {
      method,
      regex,
      params,
      handler,
      path,
      options,
    });
  }

  static extractParams(path) {
    const params = [];
    const parts = path.split("/").filter(Boolean);
    parts.forEach((part, index) => {
      if (part.startsWith(":")) {
        params.push({
          name: part.slice(1),
          index,
        });
      }
    });
    return params;
  }

  static findRoute(req) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname.substring(1);
    const method = req.method;

    for (const [_, route] of Router.routes) {
      if (route.method === method) {
        const match = path.match(route.regex);
        if (match) {
          const params = Router.extractParams(route.path, path);
          for (const param of params) {
            req.params = req?.params || {};
            req.params[param.name] = match[1];
          }
          return route;
        }
      }
    }
  }
}
