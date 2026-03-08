import React from 'react';
import { Rocket } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AsteroidsGame from '@/component/game/AsteroidsGame';
import GameBreadcrumb from '@/component/game/GameBreadcrumb';

const Asteroids: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <GameBreadcrumb gameName="Asteroids" gameIcon={<Rocket className="h-4 w-4 text-orange-500" />} />
        <div className="flex justify-center">
          <AsteroidsGame />
        </div>
      </div>
    </AppLayout>
  );
};

export default Asteroids;
