import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { OverlayView } from '@/components/OverlayView';
import { trackEvent } from '@/lib/analytics';

const SITE_URL = 'https://lifelinkmtg.app';

const OverlayPage = () => {
  const { roomId } = useParams();
  const url = `${SITE_URL}/room/${roomId ?? ''}/overlay`;

  useEffect(() => {
    trackEvent('overlay_opened');
  }, []);

  return (
    <>
      <Helmet>
        <title>Stream Overlay — LifeLink MTG Life Counter</title>
        <meta
          name="description"
          content="Read-only Magic: The Gathering life total overlay for OBS Browser Sources, sized for 1920×1080 streams."
        />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="Stream Overlay — LifeLink MTG Life Counter" />
        <meta
          property="og:description"
          content="Read-only MTG life total overlay built for OBS Browser Sources."
        />
        <meta property="og:url" content={url} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="sr-only">Magic: The Gathering OBS stream overlay</h1>
      <OverlayView />
    </>
  );
};

export default OverlayPage;
