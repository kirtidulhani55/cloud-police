import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const app = express();
const port = Number(process.env.PORT || 8080);
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const distributionDirectory = path.join(currentDirectory, 'dist');

const publicRuntimeConfig = {
  VITE_IDENTITY_PLATFORM_API_KEY:
    process.env.VITE_IDENTITY_PLATFORM_API_KEY || '',
  VITE_CLOUD_POLICE_API_URL:
    process.env.VITE_CLOUD_POLICE_API_URL || '',
  VITE_CLOUD_POLICE_APPROVAL_API_URL:
    process.env.VITE_CLOUD_POLICE_APPROVAL_API_URL || '',
};

app.disable('x-powered-by');

app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data:; " +
      "connect-src 'self' https://*.run.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'"
  );
  next();
});

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.get('/runtime-config.js', (_request, response) => {
  const serialized = JSON.stringify(publicRuntimeConfig)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  response
    .status(200)
    .type('application/javascript')
    .set('Cache-Control', 'no-store')
    .send(`window.__CLOUD_POLICE_CONFIG__ = ${serialized};`);
});

app.use(
  express.static(distributionDirectory, {
    index: false,
    maxAge: '1h',
  })
);

const applicationPaths = new Set([
  '/', '/login', '/console', '/privacy', '/terms', '/cookies',
  '/accessibility', '/support', '/password-reset', '/email-verification',
  '/access-denied', '/maintenance',
]);

app.get('*', (request, response) => {
  response
    .status(applicationPaths.has(request.path) ? 200 : 404)
    .sendFile(path.join(distributionDirectory, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Cloud Police website is listening on port ${port}.`);
});

