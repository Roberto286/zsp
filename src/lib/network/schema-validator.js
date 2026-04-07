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

    // ricorsione per oggetti annidati
    if (expectedType === "object" && instance[key] !== null) {
      if (!validateSchema(body[key], instance[key].constructor)) return false;
    }
  }

  return true;
};
