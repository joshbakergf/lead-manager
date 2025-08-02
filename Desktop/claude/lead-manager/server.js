import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Path to the built files
const DIST_DIR = path.join(__dirname, 'dist');

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist directory not found!');
  console.error('Current directory:', __dirname);
  console.error('Directory contents:', fs.readdirSync(__dirname));
  process.exit(1);
}

// Middleware to set CSP headers 
app.use((req, res, next) => {
  // Set CSP headers that allow Firebase Auth and Google APIs
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://securetoken.googleapis.com https://www.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: https://www.google.com https://lh3.googleusercontent.com; " +
    "connect-src 'self' https: wss: https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://apis.google.com; " +
    "frame-src 'self' https://accounts.google.com https://interactive-call-script.firebaseapp.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  // For published scripts and embedded content, use more permissive frame settings
  if (req.path.startsWith('/s/') || req.query.live || req.query.preview) {
    res.setHeader('X-Frame-Options', 'ALLOWALL');
  }
  
  next();
});

// Serve static files
app.use(express.static(DIST_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Catch all routes and serve index.html (for React Router)
app.get('*', (req, res) => {
  console.log(`Serving request for: ${req.path}`);
  const indexPath = path.join(DIST_DIR, 'index.html');
  console.log(`Looking for index.html at: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    console.log('Found index.html, serving file');
    res.sendFile(indexPath);
  } else {
    console.error('index.html not found!');
    console.error('DIST_DIR contents:', fs.readdirSync(DIST_DIR));
    res.status(404).send(`
      <html>
        <head><title>Build Error</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1>Build Error</h1>
          <p>index.html not found at: ${indexPath}</p>
          <p>DIST_DIR: ${DIST_DIR}</p>
          <p>Directory contents: ${fs.readdirSync(DIST_DIR).join(', ')}</p>
          <button onclick="window.location.reload()">Reload</button>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`FRONTEND server running on port ${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
  console.log('Directory contents:', fs.readdirSync(DIST_DIR));
  console.log('Environment: production (frontend)');
});