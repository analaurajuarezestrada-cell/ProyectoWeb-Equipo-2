// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter } from 'react-router-dom'; // <--- Importa BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>   {/* <--- ENVUELVE App con BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
