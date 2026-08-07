import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ObsOverlayView } from '@/components/ObsOverlayView';
import { trackEvent } from '@/lib/analytics';

const ObsOverlayPage = () => {
  useEffect(() => {
    trackEvent('overlay_loaded');
  }, []);

  return (
    <main>
      <Helmet>
        <title>OBS Overlay — LifeLink MTG Life Counter</title>
        <meta
          name="description"
          content="Transparent Magic: The Gathering life total overlay for OBS Browser Sources."
        />
        <link rel="canonical" href="https://lifelinkmtg.app/overlay" />
        <meta property="og:title" content="OBS Overlay — LifeLink MTG Life Counter" />
        <meta
          property="og:description"
          content="Transparent MTG life total overlay for OBS Browser Sources."
        />
        <meta property="og:url" content="https://lifelinkmtg.app/overlay" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="sr-only">Magic: The Gathering OBS overlay</h1>
      <ObsOverlayView />
    </main>
  );
};

export default ObsOverlayPage;
