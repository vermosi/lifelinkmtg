import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { EmbedWidget } from '@/components/EmbedWidget';

const SITE_URL = 'https://lifelinkmtg.app';

const EmbedPage = () => {
  const { roomId } = useParams();
  const url = roomId ? `${SITE_URL}/embed/${roomId}` : `${SITE_URL}/embed/`;
  const title = roomId ? `Embeddable Life Widget — Room ${roomId}` : 'Embeddable Life Widget — LifeLink';
  const description = roomId
    ? `Read-only LifeLink widget for room ${roomId}. Embed Magic: The Gathering life totals in a Twitch panel, website, or stream layout.`
    : 'Read-only embeddable MTG life total widget for Twitch panels, websites and stream layouts.';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="LifeLink" />
        <meta property="og:image" content="https://lifelinkmtg.app/lifelink-social-banner.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="LifeLink embeddable Magic: The Gathering life total widget" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://lifelinkmtg.app/lifelink-social-banner.png" />
        <meta name="twitter:image:alt" content="LifeLink embeddable Magic: The Gathering life total widget" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="sr-only">Embeddable Magic: The Gathering life total widget</h1>
      <EmbedWidget />
    </>
  );
};

export default EmbedPage;
