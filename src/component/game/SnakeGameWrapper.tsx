
import React from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SnakeGame from './SnakeGame';

const SnakeGameWrapper = () => {
  const { isAuthenticated, user } = useAuth();

  const handleGameEnd = async (finalScore: number) => {
    // Save game history for leaderboard
    if (isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('game_history')
          .insert({
            user_id: user.id,
            game_type: 'snake',
            score: finalScore
          });

        if (error) throw error;
        
        toast({
          title: "Game Over!",
          description: `You scored ${finalScore} points!`,
        });
      } catch (error) {
        console.error('Error saving game:', error);
        toast({
          title: "Game Over!",
          description: `You scored ${finalScore} points!`,
        });
      }
    } else {
      toast({
        title: "Game Over!",
        description: `You scored ${finalScore} points!`,
      });
    }
  };

  return <SnakeGame onGameEnd={handleGameEnd} />;
};

export default SnakeGameWrapper;
