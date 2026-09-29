export const enhanceResponse = (res) => {
    res.send = (data, statusCode = 200, contentType = 'application/json') => {
        res.writeHead(statusCode, { "Content-Type": contentType });
        
        // Only stringify if content type is JSON; otherwise send as-is
        const body = contentType === 'application/json' 
            ? JSON.stringify(data)
            : data;
        
        res.end(body);
    };
    
    // Add status() for Express-like chaining
    res.status = (statusCode) => {
        res._statusCode = statusCode;
        return res;
    };
    
    // Wrap send to use cached statusCode if set
    const originalSend = res.send;
    res.send = (data, statusCode, contentType = 'application/json') => {
        const code = statusCode !== undefined ? statusCode : (res._statusCode || 200);
        originalSend(data, code, contentType);
    };
}
