import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import { LanguageProvider } from './context/LanguageContext';
import { GlobalStyle } from './styles/GlobalStyle';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <LoadingProvider>
          <AuthProvider>
            <GlobalStyle />
            <App />
          </AuthProvider>
        </LoadingProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
