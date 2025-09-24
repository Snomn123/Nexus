import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <App />
);

// Performance monitoring is now enabled with detailed console logging
// You can view performance data in the browser console
// Use window.getPerformanceMetrics() to see stored metrics
// Use window.clearPerformanceMetrics() to clear stored data
reportWebVitals();
