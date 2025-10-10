# HTTPS Setup for APDS7311 POE (Required for 20 Marks)

## 🚨 **CRITICAL**: SSL/HTTPS is required for full marks!

The POE rubric allocates **20 marks** for "Securing Data in Transit with SSL". Currently running on HTTP will lose these marks.

## 📋 **Quick HTTPS Setup Options:**

### **Option 1: Using mkcert (Recommended - Easy)**

1. **Install mkcert (if not installed):**
   ```powershell
   # Using chocolatey (if installed)
   choco install mkcert
   
   # OR download from: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Generate certificates:**
   ```powershell
   # Create local CA
   mkcert -install
   
   # Generate certificates for localhost
   mkcert localhost 127.0.0.1 ::1
   ```

3. **Move certificates:**
   ```powershell
   New-Item -ItemType Directory -Force -Path "certs"
   Move-Item localhost+2.pem certs/localhost-cert.pem
   Move-Item localhost+2-key.pem certs/localhost-key.pem
   ```

### **Option 2: Using Next.js HTTPS (Alternative)**

1. **Install HTTPS support:**
   ```bash
   npm install --save-dev local-ssl-proxy
   ```

2. **Update package.json:**
   ```json
   "scripts": {
     "dev": "next dev",
     "dev:https": "local-ssl-proxy --source 3001 --target 3000 --cert localhost-cert.pem --key localhost-key.pem"
   }
   ```

### **Option 3: Production-Ready (Full Implementation)**

Create custom server.js:

```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./certs/localhost-key.pem'),
  cert: fs.readFileSync('./certs/localhost-cert.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
```

## 🎯 **Expected Results:**

- ✅ **HTTPS**: Access app at `https://localhost:3000`
- ✅ **SSL Certificate**: Valid certificate for localhost
- ✅ **Secure Headers**: Already implemented in middleware.ts
- ✅ **20 Marks**: Meets POE rubric requirements

## 🧪 **Testing SSL:**

1. **Browser**: Visit `https://localhost:3000` (accept security warning for self-signed)
2. **Postman**: Update collection base URL to `https://localhost:3000`
3. **Security**: Check for padlock icon in browser
4. **Headers**: Verify `Strict-Transport-Security` header

## ⚠️ **Important Notes:**

- **Self-signed certificates**: Browser will show security warning (this is normal for dev)
- **Postman settings**: Disable SSL verification in Settings > General
- **Production**: Use proper CA-signed certificates
- **Update environment**: Change `baseUrl` in Postman environment

This setup ensures you get the full **20 marks** for SSL implementation! 🔒