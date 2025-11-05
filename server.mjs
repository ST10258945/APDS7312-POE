import { createServer } from 'node:https';
import { parse } from 'node:url';
import next from 'next';
import fs from 'node:fs';
import path from 'node:path';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const keyPath = path.join(process.cwd(), 'certs', 'localhost-key.pem');
const certPath = path.join(process.cwd(), 'certs', 'localhost-cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('❌ SSL certificates not found!');
  console.error('Run: npm run generate-certs');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

try {
  await app.prepare(); // top-level await

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
} catch (e) {
  console.error('❌ Failed to prepare Next app:', e);
  process.exit(1);
}

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});
