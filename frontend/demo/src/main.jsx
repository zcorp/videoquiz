import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@coreui/coreui/dist/css/coreui.min.css';
import DemoApp from './DemoApp.jsx';
import './demo.css';

ReactDOM.createRoot(document.getElementById('demo-root')).render(
  <React.StrictMode>
    <HashRouter>
      <DemoApp />
    </HashRouter>
  </React.StrictMode>,
);