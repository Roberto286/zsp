export const validateSchema = (body, SchemaClass) => {
  if (!body || typeof body !== "object") return false;

  const instance = new SchemaClass(); // una sola istanza
  const expectedKeys = Object.getOwnPropertyNames(instance);

  for (const key of expectedKeys) {
    // campo obbligatorio mancante
    if (!Object.hasOwn(body, key)) return false;

    const expectedType = typeof instance[key]; // es. "string", "number"
    const actualType = typeof body[key];

    // validazione tipo primitivo
    if (expectedType !== "object" && expectedType !== actualType) return false;

    // ricorsione per oggetti annidati (non array)
    if (expectedType === "object" && instance[key] !== null && !Array.isArray(instance[key])) {
      if (!validateSchema(body[key], instance[key].constructor)) return false;
    }

    // validazione array
    if (Array.isArray(instance[key])) {
      if (!Array.isArray(body[key])) return false;
      // se l'array schema ha elementi, valida il tipo
      if (instance[key].length > 0) {
        const expectedItemType = typeof instance[key][0];
        for (const item of body[key]) {
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
