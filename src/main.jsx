import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { APP_META } from './config/appConfig';
import './index.css';

document.title = APP_META.title;

const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) {
  metaDescription.setAttribute('content', APP_META.description);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
