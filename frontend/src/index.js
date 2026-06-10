                /**
 * ==========================================
 * SkillSwap Frontend Entry Point
 * ==========================================
 * 
 * Renders the React application into the DOM.
 * Uses React 18 createRoot API for concurrent features.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create root and render the App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
