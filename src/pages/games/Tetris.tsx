import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import TetrisGame from '@/components/game/TetrisGame';
import AppLayout from '@/components/layout/AppLayout';

const Tetris: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGameEnd = async (score: number) => {
    if (!user) return;

    try {
      // Save game score to database
      const { error } = await supabase
        .from('game_history')
        .insert([
          {
            user_id: user.id,
            game_type: 'tetris',
            score: score
          }
        ]);

      if (error) {
        console.error('Error saving game score:', error);
      }

      toast({
        title: "Game Over!",
        description: `You scored ${score} points!`,
      });
    } catch (error) {
      console.error('Error handling game end:', error);
    }
  };

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
            <h1 className="text-3xl font-bold">Tetris</h1>
          </div>
        </div>
        
        <div className="flex justify-center">
          <TetrisGame onGameEnd={handleGameEnd} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Tetris;