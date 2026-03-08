import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Circle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PongGame from '@/component/game/PongGame';
import GameBreadcrumb from '@/component/game/GameBreadcrumb';

const Pong: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');
  const isHost = searchParams.get('host') === 'true';

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <GameBreadcrumb gameName="Pong" gameIcon={<Circle className="h-4 w-4 text-blue-500" />} />
        <div className="flex justify-center">
          <PongGame initialRoomCode={roomCode} initialIsHost={isHost} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Pong;
