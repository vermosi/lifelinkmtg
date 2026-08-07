import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import RoomPage from './pages/RoomPage';
import OverlayPage from './pages/OverlayPage';
import EmbedPage from './pages/EmbedPage';
import TwitchExtensionPage from './pages/TwitchExtensionPage';
import FaviconCheck from './pages/FaviconCheck';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const MainApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <main>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/room/:roomId/overlay" element={<OverlayPage />} />
          <Route path="/embed/:roomId" element={<EmbedPage />} />
          <Route path="/favicon-check" element={<FaviconCheck />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </TooltipProvider>
  </QueryClientProvider>
);

export default MainApp;
