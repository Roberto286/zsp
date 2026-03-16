export const HttpMethods = Object.freeze({
    GET: "GET", POST: "POST", PUT: "PUT", DELETE: "DELETE", PATCH: "PATCH"
} as const)

export type HttpMethods = typeof HttpMethods[keyof typeof HttpMethods] 
