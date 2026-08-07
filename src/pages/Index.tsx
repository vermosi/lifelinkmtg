import { Helmet } from 'react-helmet-async';
import { RoomSelector } from '@/components/RoomSelector';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>LifeLink — Free MTG Life Counter, Commander EDH Tracker &amp; OBS/Twitch Overlay</title>
        <meta name="description" content="Free Magic: The Gathering life counter for 2–6 players. Track Commander/EDH life totals, commander damage, poison, energy, Monarch, and Initiative. Share rooms via QR code, then stream with the OBS Browser Source overlay or native Twitch extension." />
        <link rel="canonical" href="https://lifelinkmtg.app/" />
      </Helmet>
      <RoomSelector />
    </>
  );
};

export default Index;
