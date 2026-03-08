import React from 'react';
import { Zap } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import GeometryDashGame from '@/component/game/GeometryDashGame';
import GameBreadcrumb from '@/component/game/GameBreadcrumb';

const GeometryDash: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <GameBreadcrumb gameName="Geometry Dash" gameIcon={<Zap className="h-4 w-4 text-yellow-500" />} />
        <div className="flex justify-center">
          <GeometryDashGame />
        </div>
      </div>
    </AppLayout>
  );
};

export default GeometryDash;
