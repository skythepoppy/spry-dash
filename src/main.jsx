import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { EntriesProvider } from './context/EntriesContext.jsx';
import { SavingsGoalsProvider } from './context/SavingsGoalsContext.jsx';

function Root() {
  return (
    <EntriesProvider>
      <SavingsGoalsProvider>
        <App />
      </SavingsGoalsProvider>
    </EntriesProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
