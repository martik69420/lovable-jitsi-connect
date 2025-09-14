
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

// Game types
type GameType = 'snake' | 'tetris' | 'trivia';

// Game state structure
interface GameState {
  progress: {
    snake: { gamesPlayed: number; highScore: number };
    tetris: { gamesPlayed: number; highScore: number };
    trivia: { gamesPlayed: number; highScore: number };
  };
}

interface GameContextType {
  gameScores: Record<GameType, number>;
  updateGameScore: (game: GameType, score: number) => void;
  bestScores: Record<GameType, number>;
  isLoading: boolean;
  
  // Add missing methods for specific game score updates
  updateSnakeScore: (score: number) => void;
  updateTetrisScore: (score: number) => void;
  updateTriviaScore: (score: number) => void;
  
  // Add game state
  gameState: GameState;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth();
  
  const [gameScores, setGameScores] = useState<Record<GameType, number>>({
    snake: 0,
    tetris: 0,
    trivia: 0
  });
  
  const [bestScores, setBestScores] = useState<Record<GameType, number>>({
    snake: 0,
    tetris: 0,
    trivia: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize game state
  const [gameState, setGameState] = useState<GameState>({
    progress: {
      snake: { gamesPlayed: 0, highScore: 0 },
      tetris: { gamesPlayed: 0, highScore: 0 },
      trivia: { gamesPlayed: 0, highScore: 0 }
    }
  });
  
  // Fetch best scores from the database
  useEffect(() => {
    const fetchBestScores = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('game_history')
          .select('game_type, score')
          .eq('user_id', currentUser.id)
          .order('score', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Process the data to get best scores for each game
        const scores: Record<GameType, number> = {
          snake: 0,
          tetris: 0,
          trivia: 0
        };
        
        if (data) {
          data.forEach(record => {
            const gameType = record.game_type as GameType;
            if (gameType && scores[gameType] < record.score) {
              scores[gameType] = record.score;
            }
          });
        }
        
        setBestScores(scores);
        
        // Update game state with high scores
        setGameState(prevState => ({
          ...prevState,
          progress: {
            snake: { ...prevState.progress.snake, highScore: scores.snake },
            tetris: { ...prevState.progress.tetris, highScore: scores.tetris },
            trivia: { ...prevState.progress.trivia, highScore: scores.trivia }
          }
        }));
      } catch (error) {
        console.error('Error fetching game scores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBestScores();
  }, [currentUser]);
  
  const updateGameScore = async (game: GameType, score: number) => {
    if (!currentUser) return;
    
    try {
      // Update local state
      setGameScores(prev => ({
        ...prev,
        [game]: score
      }));
      
      // If this is a new best score, update that too
      if (score > bestScores[game]) {
        setBestScores(prev => ({
          ...prev,
          [game]: score
        }));
        
        // Update game state
        setGameState(prevState => ({
          ...prevState,
          progress: {
            ...prevState.progress,
            [game]: { 
              ...prevState.progress[game],
              highScore: score,
              gamesPlayed: prevState.progress[game].gamesPlayed + 1
            }
          }
        }));
        
        // Add to database
        const { error } = await supabase
          .from('game_history')
          .insert({
            user_id: currentUser.id,
            game_type: game,
            score: score
          });
          
        if (error) {
          throw error;
        }
      } else {
        // Even if not a high score, increment games played
        setGameState(prevState => ({
          ...prevState,
          progress: {
            ...prevState.progress,
            [game]: { 
              ...prevState.progress[game],
              gamesPlayed: prevState.progress[game].gamesPlayed + 1
            }
          }
        }));
      }
    } catch (error) {
      console.error('Error updating game score:', error);
    }
  };
  
  // Game-specific update methods
  const updateSnakeScore = (score: number) => {
    updateGameScore('snake', score);
  };
  
  const updateTetrisScore = (score: number) => {
    updateGameScore('tetris', score);
  };
  
  const updateTriviaScore = (score: number) => {
    updateGameScore('trivia', score);
  };
  
  return (
    <GameContext.Provider
      value={{
        gameScores,
        updateGameScore,
        bestScores,
        isLoading,
        updateSnakeScore,
        updateTetrisScore,
        updateTriviaScore,
        gameState
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
