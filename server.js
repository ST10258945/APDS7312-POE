const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// SSL certificate paths
const keyPath = path.join(__dirname, 'certs', 'localhost-key.pem');
const certPath = path.join(__dirname, 'certs', 'localhost-cert.pem');

// Check if SSL certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('❌ SSL certificates not found!');
  console.error('Run: npm run generate-certs');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(3000, (err) => {
    if (err) {
      console.error('❌ Failed to start HTTPS server:', err);
      process.exit(1);
    }
    
    console.log('🚀 GlobeWire Payment API (HTTPS) is ready!');
    console.log('📍 Server running on: https://localhost:3000');
    console.log('🔒 SSL/TLS enabled with self-signed certificate');
    console.log('⚠️  Browser will show security warning - this is normal for self-signed certs');
    console.log('📊 Ready for POE testing with full SSL compliance!');
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});