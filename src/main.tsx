import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initPwa } from './pwa';
import { initAnalytics } from './analytics';
import { installDebugHook } from './debug';

initPwa();
initAnalytics();
installDebugHook();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
