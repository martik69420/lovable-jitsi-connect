import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AsteroidsGame from '@/component/game/AsteroidsGame';

const Asteroids: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/games')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Games
            </Button>
            <h1 className="text-3xl font-bold">Asteroids</h1>
          </div>
        </div>
        
        <div className="flex justify-center">
          <AsteroidsGame />
        </div>
      </div>
    </AppLayout>
  );
};

export default Asteroids;
