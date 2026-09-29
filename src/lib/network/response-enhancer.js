export const enhanceResponse = (res) => {
    res.send = (data, statusCode = 200, contentType = 'application/json') => {
        res.writeHead(statusCode, { "Content-Type": contentType });
        
        // Only stringify if content type is JSON; otherwise send as-is
        const body = contentType === 'application/json' 
            ? JSON.stringify(data)
            : data;
        
        res.end(body);
    };
}
