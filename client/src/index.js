import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Initialiser la configuration axios
import './utils/axiosConfig';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

