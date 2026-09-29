export const validateSchema = (body, schema) => {
  if (!body || typeof body !== "object") return false;

  // Detect if schema is constructible (class/function) or plain object
  const isConstructor = typeof schema === 'function';
  const instance = isConstructor ? new schema() : schema;
  const expectedKeys = Object.getOwnPropertyNames(instance);

  for (const key of expectedKeys) {
    // campo obbligatorio mancante
    if (!Object.hasOwn(body, key)) return false;

    const expectedValue = instance[key];
    const actualValue = body[key];
    const actualType = typeof actualValue;

    // For plain object schemas: detect string type names like 'string', 'number', etc.
    if (typeof expectedValue === 'string' && ['string', 'number', 'boolean', 'object', 'function', 'symbol', 'undefined'].includes(expectedValue)) {
      // Type name declaration: validate type
      if (actualType !== expectedValue) return false;
      continue;
    }

    // For class-based schemas: check primitive type match
    const expectedType = typeof expectedValue;
    if (expectedType !== "object" && expectedType !== actualType) return false;

    // ricorsione per oggetti annidati (non array)
    if (expectedType === "object" && expectedValue !== null && !Array.isArray(expectedValue)) {
      if (!validateSchema(actualValue, expectedValue.constructor)) return false;
    }

    // validazione array
    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(actualValue)) return false;
      // se l'array schema ha elementi, valida il tipo
      if (expectedValue.length > 0) {
        const expectedItemType = typeof expectedValue[0];
        for (const item of actualValue) {
          if (typeof item !== expectedItemType) return false;
        }
      }
    }
  }

  // rejezione campi extra non dichiarati nello schema
  const bodyKeys = Object.keys(body);
  const hasExtraFields = bodyKeys.some(key => !expectedKeys.includes(key));
  if (hasExtraFields) return false;

  return true;
};
