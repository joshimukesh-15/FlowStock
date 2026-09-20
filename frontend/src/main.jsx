import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

// Global uncaught error handler to prevent silent white screens
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Captured window error:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Captured unhandled rejection:', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
