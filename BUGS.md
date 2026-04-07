# Bug Tracker - ZSP Library

Elenco completo dei bug e problemi riscontrati nella libreria @roberto286/zsp.

---

##  BUG #1 - URL Parameters non estratti correttamente

**Severità:** CRITICA  
**File:** `src/lib/network/router.js`  
**Linea:** 40

### Problema
I parametri URL (`:id`, `:postId`, etc.) non vengono mai estratti correttamente. `req.params` è sempre vuoto o undefined.

### Codice Errato
```javascript
// Linea 40 - BUG: extractParams accetta 1 argomento, ne passa 2
// E non usa il match per estrarre i VALORI!
req.params = Router.extractParams(route.path, path);
```

### Comportamento Attuale
- `GET /users/123` → `req.params` = `{}` o `undefined`
- I valori dei parametri non sono accessibili nel handler

### Fix Proposto
```javascript
static extractParamValues(route, match) {
    const values = {};
    route.params.forEach((param, index) => {
        values[param.name] = match[param.index + 1]; // +1 perché match[0] è la stringa intera
    });
    return values;
}

// Nel findRoute:
req.params = Router.extractParamValues(route, match);
```

---

##  BUG #2 - Schema Validation: Array trattati come Object

**Severità:** CRITICA  
**File:** `src/lib/network/schema-validator.js`  
**Linea:** 15-19

### Problema
Gli array in JavaScript hanno `typeof === "object"`. Il validatore tenta di validare un array come oggetto nested, causando errori o comportamenti imprevedibili.

### Codice Errato
```javascript
if (expectedType === "object" && instance[key] !== null) {
    // BUG: entra qui anche per gli array!
    if (!validateSchema(body[key], instance[key].constructor)) return false;
}
```

### Comportamento Attuale
```javascript
// Schema:
class Post {
    tags: string[] = [];  // Array!
}

// Body valido:
{ tags: ["javascript", "nodejs"] }

// Risultato: Errore o validazione fallita perché tenta di validare 
// l'array come oggetto nested
```

### Fix Proposto
```javascript
if (expectedType === "object" && instance[key] !== null && !Array.isArray(instance[key])) {
    if (!validateSchema(body[key], instance[key].constructor)) return false;
}

// Aggiungere anche validazione array
if (Array.isArray(instance[key])) {
    if (!Array.isArray(body[key])) return false;
    // Opzionale: validare tipo degli elementi dell'array
}
```

---

##  BUG #3 - Schema Validation: Array non validati

**Severità:** ALTA  
**File:** `src/lib/network/schema-validator.js`

### Problema
Non c'è logica per validare che un campo array contenga elementi del tipo corretto.

### Esempio
```javascript
// Schema:
class Post {
    tags: string[] = [];
}

// Body che passa la validazione (ERRATO!):
{ tags: [123, 456] }  // Numbers invece di strings

// Body che dovrebbe passare:
{ tags: ["javascript", "nodejs"] }
```

### Fix Proposto
Aggiungere validazione degli elementi dell'array:
```javascript
if (Array.isArray(instance[key])) {
    if (!Array.isArray(body[key])) return false;
    // Se l'array schema ha elementi, valida il tipo
    if (instance[key].length > 0) {
        const expectedItemType = typeof instance[key][0];
        for (const item of body[key]) {
            if (typeof item !== expectedItemType) return false;
        }
    }
}
```

---

##  BUG #4 - Missing Query String Support

**Severità:** MEDIA  
**File:** `src/lib/network/router.js`  
**Linea:** 32

### Problema
- `url.parse()` è deprecato (DEP0169 warning)
- `req.query` non viene mai popolato

### Codice Errato
```javascript
const parsedUrl = url.parse(req.url, true);  // Deprecated
// parsedUrl.query esiste ma non viene assegnato a req.query
```

### Comportamento Attuale
```javascript
// GET /users?active=true&page=2
req.query  // undefined - non accessibile!
```

### Fix Proposto
```javascript
// Usare URL API (non deprecata)
const url = new URL(req.url, `http://${req.headers.host}`);
req.query = Object.fromEntries(url.searchParams);
```

---

##  BUG #5 - Schema Validation: Campi Extra Accettati

**Severità:** MEDIA  
**File:** `src/lib/network/schema-validator.js`

### Problema
Il body può contenere campi non previsti dallo schema e passa comunque la validazione.

### Esempio
```javascript
// Schema:
class User {
    name: string = "";
    age: number = 0;
}

// Body che passa (dovrebbe fallire!):
{
    name: "Mario",
    age: 30,
    password: "secret123",  // Campo non previsto!
    isAdmin: true           // Altro campo extra!
}
```

### Fix Proposto
Aggiungere opzione `strict: true` (default true):
```javascript
export const validateSchema = (body, SchemaClass, strict = true) => {
    // ... validazione esistente ...
    
    if (strict) {
        const bodyKeys = Object.keys(body);
        const hasExtraFields = bodyKeys.some(key => !expectedKeys.includes(key));
        if (hasExtraFields) return false;
    }
    
    return true;
};
```

---

##  BUG #6 - Body Parser: No Content-Type Check

**Severità:** MEDIA  
**File:** `src/lib/network/body-parser.js`

### Problema
Il parser tenta sempre di fare JSON.parse, anche per richieste che non sono JSON.

### Comportamento Attuale
- Richieste senza body → errore silenzioso o body vuoto
- Richieste `text/plain` → tenta JSON.parse e fallisce
- Richieste `multipart/form-data` → comportamento imprevedibile

### Fix Proposto
```javascript
export const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        // Controlla Content-Type
        const contentType = req.headers['content-type'] || '';
        
        if (!contentType.includes('application/json')) {
            resolve(undefined);  // O {} secondo preferenza
            return;
        }
        
        // Per DELETE e GET senza body
        if (req.method === 'GET' || req.method === 'DELETE') {
            resolve(undefined);
            return;
        }
        
        // ... resto del codice esistente ...
    });
}
```

---

##  BUG #7 - Route Registration: No Duplicate Check

**Severità:** BASSA  
**File:** `src/lib/network/router.js`  
**Linea:** 14

### Problema
Registrare due volte la stessa rotta sovrascrive silenziosamente la precedente senza warning.

### Esempio
```javascript
app.get('/users', handler1);
app.get('/users', handler2);  // handler1 sovrascritto silenziosamente!
```

### Fix Proposto
```javascript
static register(path, method, handler, options) {
    const key = `${method}:${path}`;
    
    if (Router.routes.has(key)) {
        console.warn(`[ZSP Warning] Route ${method} ${path} is already registered. Overwriting.`);
    }
    
    // ... resto del codice ...
}
```

---

##  BUG #8 - Response Enhancer: No Content-Type Override

**Severità:** BASSA  
**File:** `src/lib/network/response-enhancer.js`  
**Linea:** 2-5

### Problema
`res.send()` forza sempre `application/json`. Non è possibile inviare HTML, plain text, o altri content-type.

### Comportamento Attuale
```javascript
res.send('<h1>Hello</h1>');  // Content-Type: application/json
// Risultato: Il browser interpreta l'HTML come JSON
```

### Fix Proposto
```javascript
export const enhanceResponse = (res) => {
    res.send = (data, statusCode = 200, contentType = 'application/json') => {
        res.writeHead(statusCode, { "Content-Type": contentType });
        
        // Se contentType è JSON, stringify, altrimenti invia così com'è
        const body = contentType === 'application/json' 
            ? JSON.stringify(data) 
            : data;
            
        res.end(body);
    };
}
```

---

##  BUG #9 - Router: Regex Match Parziale

**Severità:** MEDIA  
**File:** `src/lib/network/router.js`  
**Linea:** 10-12

### Problema
La regex creata potrebbe fare match parziali invece di match esatti.

### Esempio
```javascript
// Route registrata:
app.get('/users/:id', handler);

// URL richiesto:
GET /users/123/extra/path

// Comportamento: Fa match con /users/:id invece di 404!
```

### Fix Proposto
```javascript
const regex = new RegExp('^' + parts.map(part =>
    part.startsWith(':') ? '([^/]+)' : part
).join('/') + '/?$');  // Aggiunto $ e /? opzionale
```

---

##  BUG #10 - Missing CORS Support

**Severità:** BASSA  
**File:** `src/lib/network/server.js`

### Problema
Nessun supporto nativo per CORS headers. Le richieste cross-origin falliscono.

### Fix Proposto
Aggiungere middleware CORS opzionale:
```javascript
app.enableCors = (options = {}) => {
    // Implementazione CORS
};
```

---

##  BUG #11 - Error Handler: No Stack Trace

**Severità:** BASSA  
**File:** `src/lib/network/server.js`  
**Linea:** 55-57

### Problema
Gli errori vengono loggati in console ma l'utente non riceve dettagli utili in sviluppo.

### Comportamento Attuale
```javascript
#handleError(error, res) {
    console.error(error);  // Solo console
    res.send("Internal server error", 500);  // Generico
}
```

### Fix Proposto
Aggiungere modalità debug:
```javascript
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
```

---

##  BUG #12 - Missing Middleware Support

**Severità:** BASSA  
**File:** `src/lib/network/server.js`

### Problema
Non c'è modo di registrare middleware globali (es: logging, auth) che si applichino a tutte le route.

### Esempio di Feature Mancante
```javascript
// Non supportato:
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
```

---

##  Riepilogo per Priorità

### CRITICI (Bloccano funzionalità base)
1. [ ] Bug #1 - URL Parameters
2. [ ] Bug #2 - Array validation

### ALTI (Limitano uso reale)
3. [ ] Bug #3 - Array element validation
4. [ ] Bug #4 - Query string support
5. [ ] Bug #9 - Regex match esatto

### MEDIA (Migliorano robustezza)
6. [ ] Bug #5 - Campi extra in schema
7. [ ] Bug #6 - Content-Type check

### BASSI (Nice to have)
8. [ ] Bug #7 - Duplicate route warning
9. [ ] Bug #8 - Content-Type override
10. [ ] Bug #10 - CORS support
11. [ ] Bug #11 - Stack trace in dev
12. [ ] Bug #12 - Middleware support

---

*Ultimo aggiornamento: 2026-04-07*
