import { Helmet } from 'react-helmet-async';
import { RoomSelector } from '@/components/RoomSelector';

const Index = () => {
  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://lifelinkmtg.app/" />
      </Helmet>
      <RoomSelector />
    </>
  );
};

export default Index;
