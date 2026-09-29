export class Router {

    static routes = new Map();

    static register(path, method, handler, options) {
        const key = `${method}:${path}`;

        if (Router.routes.has(key)) {
            console.warn(`[ZSP Warning] Route ${method} ${path} is already registered. Overwriting.`);
        }

        const parts = path.split('/').filter(Boolean);
        const params = Router.extractParams(path);
        const regex = new RegExp('^' + parts.map(part =>
            part.startsWith(':') ? '([^/]+)' : part
        ).join('/') + '$');

        Router.routes.set(key, { method, regex, params, handler, path, options });
    }

    static extractParams(path) {
        const params = [];
        const parts = path.split('/').filter(Boolean);
        parts.forEach((part, index) => {
            if (part.startsWith(':')) {
                params.push({
                    name: part.slice(1),
                    index
                });
            }
        });
        return params;
    }

    static extractParamValues(route, match) {
        const values = {};
        route.params.forEach((param, idx) => {
            values[param.name] = match[idx + 1];
        });
        return values;
    }

    static findRoute(req) {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const path = urlObj.pathname.substring(1);
        const method = req.method;
        req.query = Object.fromEntries(urlObj.searchParams);

        for (const [_, route] of Router.routes) {
            if (route.method === method) {
                const match = path.match(route.regex);
                if (match) {
                    req.params = Router.extractParamValues(route, match);
                    return route;
                }
            }
        }
    }
}
