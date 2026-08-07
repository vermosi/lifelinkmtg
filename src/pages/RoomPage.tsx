import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { RoomControl } from '@/components/RoomControl';

const SITE_URL = 'https://lifelinkmtg.app';

const RoomPage = () => {
  const { roomId } = useParams();
  const url = `${SITE_URL}/room/${roomId ?? ''}`;

  return (
    <>
      <Helmet>
        <title>Game Room — LifeLink MTG Life Counter</title>
        <meta
          name="description"
          content="Live Magic: The Gathering game room. Track life totals, commander damage, poison, and turn order with everyone at the table."
        />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="Game Room — LifeLink MTG Life Counter" />
        <meta
          property="og:description"
          content="Shared MTG life tracking room with commander damage, counters, and turn order."
        />
        <meta property="og:url" content={url} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 className="sr-only">Magic: The Gathering game room life tracker</h1>
      <RoomControl />
    </>
  );
};

export default RoomPage;
