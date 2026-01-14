import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const MainApp = lazy(() => import('./MainApp'));
const ObsOverlayPage = lazy(() => import('./pages/ObsOverlayPage'));

const App = () => (
  <BrowserRouter>
    <Suspense
      fallback={(
        <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
          <div className="font-display text-3xl">Loading…</div>
        </div>
      )}
    >
      <Routes>
        <Route path="/overlay" element={<ObsOverlayPage />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
