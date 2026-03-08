import React from 'react';
import { Gamepad } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import TetrisGame from '@/components/game/TetrisGame';
import AppLayout from '@/components/layout/AppLayout';
import GameBreadcrumb from '@/component/game/GameBreadcrumb';

const Tetris: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGameEnd = async (score: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('game_history')
        .insert([{ user_id: user.id, game_type: 'tetris', score }]);
      if (error) console.error('Error saving game score:', error);
      toast({ title: "Game Over!", description: `You scored ${score} points!` });
    } catch (error) {
      console.error('Error handling game end:', error);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <GameBreadcrumb gameName="Tetris" gameIcon={<Gamepad className="h-4 w-4 text-purple-600" />} />
        <div className="flex justify-center">
          <TetrisGame onGameEnd={handleGameEnd} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Tetris;
