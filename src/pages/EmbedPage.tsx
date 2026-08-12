import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { EmbedWidget } from '@/components/EmbedWidget';

const SITE_URL = 'https://lifelinkmtg.app';

const EmbedPage = () => {
  const { roomId } = useParams();
const description =
  roomId && /^[A-Za-z0-9]+$/.test(roomId)
    ? `Read-only LifeLink widget for room ${roomId}. Embed Magic: The Gathering life totals in a Twitch panel, website, or stream layout.`
    : 'Read-only embeddable MTG life total widget for Twitch panels, websites and stream layouts.';

  return (
    <>
      <Helmet>
        <title>Embeddable Life Widget — LifeLink</title>
        <meta
          name="description"
          content="Read-only embeddable MTG life total widget for Twitch panels, websites and stream layouts."
        />
        <link rel="canonical" href={url} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="sr-only">Embeddable Magic: The Gathering life total widget</h1>
      <EmbedWidget />
    </>
  );
};

export default EmbedPage;
