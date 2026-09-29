export const parseBody = (req) => {
    return new Promise((resolve, reject) => {
        // Check Content-Type header
        const contentType = req.headers['content-type'] || '';
        
        // GET/DELETE requests should not have bodies
        if (req.method === 'GET' || req.method === 'DELETE') {
            resolve(undefined);
            return;
        }
        
        // Only parse application/json
        if (!contentType.includes('application/json')) {
            resolve(undefined);
            return;
        }
        
        let body = [];
        req.on('error', reject)
           .on('data', chunk => body.push(chunk))
           .on('end', () => {
               body = Buffer.concat(body).toString();
               try {
                   resolve(JSON.parse(body));
               }catch(e) {
                   resolve(body);
               }
           });
    });
}
