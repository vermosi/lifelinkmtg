import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { enableCloudAnalytics } from './lib/analyticsCloud';
import './index.css';

enableCloudAnalytics();

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </AppErrorBoundary>
);
