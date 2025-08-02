import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

console.log('main.tsx loading...');

// Add window error handler to catch any uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering React app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Failed to render React app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #ffebee; border: 1px solid #f44336; margin: 20px; font-family: Arial, sans-serif;">
      <h2>Application Failed to Load</h2>
      <p><strong>Error:</strong> ${error}</p>
      <p><strong>URL:</strong> ${window.location.href}</p>
      <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Page</button>
      <hr>
      <details>
        <summary>Technical Details</summary>
        <pre>${JSON.stringify({
          href: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search,
          timestamp: new Date().toISOString()
        }, null, 2)}</pre>
      </details>
    </div>
  `;
}