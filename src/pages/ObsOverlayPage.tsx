import { useEffect } from 'react';
import { ObsOverlayView } from '@/components/ObsOverlayView';
import { trackEvent } from '@/lib/analytics';

const ObsOverlayPage = () => {
  useEffect(() => {
    trackEvent('overlay_loaded');
  }, []);

  return <main><ObsOverlayView /></main>;
};

export default ObsOverlayPage;
