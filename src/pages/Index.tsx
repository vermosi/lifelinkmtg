import { Helmet } from 'react-helmet-async';
import { RoomSelector } from '@/components/RoomSelector';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>LifeLink — Free MTG Life Counter &amp; OBS Overlay for Commander</title>
        <meta name="description" content="Track Magic: The Gathering life totals in real time. Free Commander/EDH counter with cloud sync, player counters, and a streaming-ready OBS overlay." />
        <link rel="canonical" href="https://lifelinkmtg.app/" />
      </Helmet>
      <RoomSelector />
    </>
  );
};

export default Index;
