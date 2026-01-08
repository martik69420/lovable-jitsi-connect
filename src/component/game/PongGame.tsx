import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Play, Users, Loader2 } from 'lucide-react';

interface PongGameProps {
  onGameEnd?: (score: number) => void;
  initialRoomCode?: string | null;
  initialIsHost?: boolean;
}

interface GameState {
  ball: { x: number; y: number; vx: number; vy: number };
  paddle1: number;
  paddle2: number;
  score1: number;
  score2: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner: 'player1' | 'player2' | null;
  playAgainRequested: boolean;
  opponentPlayAgainRequested: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;

const PongGame: React.FC<PongGameProps> = ({ onGameEnd, initialRoomCode, initialIsHost }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: 4 },
    paddle1: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    paddle2: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score1: 0,
    score2: 0,
    gameStarted: false,
    gameOver: false,
    winner: null,
    playAgainRequested: false,
    opponentPlayAgainRequested: false,
  });
  const WIN_SCORE = 10;
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [localPaddle, setLocalPaddle] = useState(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const gameLoopRef = useRef<number>();
  const channelRef = useRef<any>(null);

  const resetBall = useCallback(() => {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * 4,
      vy: (Math.random() - 0.5) * 6,
    };
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
      winner: null,
      score1: 0,
      score2: 0,
      ball: resetBall(),
      playAgainRequested: false,
      opponentPlayAgainRequested: false,
    }));
  }, [resetBall]);

  const requestPlayAgain = useCallback(() => {
    setGameState(prev => {
      if (prev.opponentPlayAgainRequested) {
        // Both requested, start new game
        return {
          ...prev,
          gameStarted: true,
          gameOver: false,
          winner: null,
          score1: 0,
          score2: 0,
          ball: resetBall(),
          playAgainRequested: false,
          opponentPlayAgainRequested: false,
        };
      }
      return { ...prev, playAgainRequested: true };
    });
    channelRef.current?.send({
      type: 'broadcast',
      event: 'play_again_request',
      payload: { userId: user?.id },
    });
  }, [user?.id, resetBall]);

  const createRoom = async () => {
    if (!user) return;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const username = user.username || user.displayName || 'player';
    const shortName = username.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
    const newRoomId = `pong_${shortName}${randomNum}`;
    setRoomId(newRoomId);
    setIsHost(true);
    setWaiting(true);
    joinChannel(newRoomId, true);
  };

  const joinRoom = async (id: string) => {
    if (!user) return;
    const roomIdToJoin = id.startsWith('pong_') ? id : `pong_${id}`;
    setRoomId(roomIdToJoin);
    setIsHost(false);
    joinChannel(roomIdToJoin, false);
  };

  const joinChannel = (id: string, host: boolean) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`room_${id}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'player_join' }, ({ payload }) => {
        if (host && payload.userId !== user?.id) {
          setOpponent(payload.username);
          setWaiting(false);
          // Start game immediately
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'game_start',
              payload: { hostId: user?.id, hostUsername: user?.username },
            });
            startGame();
          }, 500);
        }
      })
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        if (!host) {
          setOpponent(payload.hostUsername);
          startGame();
        }
      })
      .on('broadcast', { event: 'play_again_request' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setGameState(prev => {
            if (prev.playAgainRequested) {
              // Both requested, start new game
              return {
                ...prev,
                gameStarted: true,
                gameOver: false,
                winner: null,
                score1: 0,
                score2: 0,
                ball: resetBall(),
                playAgainRequested: false,
                opponentPlayAgainRequested: false,
              };
            }
            return { ...prev, opponentPlayAgainRequested: true };
          });
        }
      })
      .on('broadcast', { event: 'paddle_move' }, ({ payload }) => {
        setGameState(prev => ({
          ...prev,
          [host ? 'paddle2' : 'paddle1']: payload.position,
        }));
      })
      .on('broadcast', { event: 'ball_update' }, ({ payload }) => {
        if (!host) {
          setGameState(prev => ({
            ...prev,
            ball: payload.ball,
            score1: payload.score1,
            score2: payload.score2,
          }));
        }
      })
      .on('broadcast', { event: 'game_over' }, ({ payload }) => {
        if (!host) {
          setGameState(prev => ({
            ...prev,
            score1: payload.score1,
            score2: payload.score2,
            gameStarted: false,
            gameOver: true,
            winner: payload.winner,
          }));
        }
      })
      .on('broadcast', { event: 'player_leave' }, () => {
        setOpponent(null);
        setGameState(prev => ({ ...prev, gameStarted: false, gameOver: false }));
        setWaiting(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !host) {
          channel.send({
            type: 'broadcast',
            event: 'player_join',
            payload: { userId: user?.id, username: user?.username },
          });
        }
      });

    channelRef.current = channel;
  };

  // Handle paddle movement with mouse and keyboard
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !gameState.gameStarted) return;

      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newPaddle = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y - PADDLE_HEIGHT / 2));
      
      setLocalPaddle(newPaddle);
      setGameState(prev => ({
        ...prev,
        [isHost ? 'paddle1' : 'paddle2']: newPaddle,
      }));

      channelRef.current?.send({
        type: 'broadcast',
        event: 'paddle_move',
        payload: { position: newPaddle },
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.gameStarted) return;
      
      const PADDLE_SPEED = 20;
      let newPaddle = localPaddle;
      
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        newPaddle = Math.max(0, localPaddle - PADDLE_SPEED);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        newPaddle = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, localPaddle + PADDLE_SPEED);
      } else {
        return; // Don't process other keys
      }
      
      e.preventDefault();
      setLocalPaddle(newPaddle);
      setGameState(prev => ({
        ...prev,
        [isHost ? 'paddle1' : 'paddle2']: newPaddle,
      }));

      channelRef.current?.send({
        type: 'broadcast',
        event: 'paddle_move',
        payload: { position: newPaddle },
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.gameStarted, isHost, localPaddle]);

  // Game loop (host only)
  useEffect(() => {
    if (!isHost || !gameState.gameStarted) return;

    const gameLoop = () => {
      setGameState(prev => {
        let { ball, paddle1, paddle2, score1, score2 } = prev;
        
        // Move ball
        let newX = ball.x + ball.vx;
        let newY = ball.y + ball.vy;
        let newVx = ball.vx;
        let newVy = ball.vy;

        // Wall collision (top/bottom)
        if (newY <= 0 || newY >= CANVAS_HEIGHT - BALL_SIZE) {
          newVy = -newVy;
          newY = Math.max(0, Math.min(CANVAS_HEIGHT - BALL_SIZE, newY));
        }

        // Paddle collision
        if (newX <= PADDLE_WIDTH + 10 && newY + BALL_SIZE >= paddle1 && newY <= paddle1 + PADDLE_HEIGHT) {
          newVx = Math.abs(newVx) * 1.05;
          newVy += (newY - (paddle1 + PADDLE_HEIGHT / 2)) * 0.1;
        }
        if (newX >= CANVAS_WIDTH - PADDLE_WIDTH - 20 && newY + BALL_SIZE >= paddle2 && newY <= paddle2 + PADDLE_HEIGHT) {
          newVx = -Math.abs(newVx) * 1.05;
          newVy += (newY - (paddle2 + PADDLE_HEIGHT / 2)) * 0.1;
        }

        // Score
        if (newX <= 0) {
          score2++;
          if (score2 >= WIN_SCORE) {
            // Player 2 wins
            channelRef.current?.send({
              type: 'broadcast',
              event: 'game_over',
              payload: { winner: 'player2', score1, score2 },
            });
            return { ...prev, score1, score2, gameStarted: false, gameOver: true, winner: 'player2' };
          }
          const reset = resetBall();
          newX = reset.x;
          newY = reset.y;
          newVx = reset.vx;
          newVy = reset.vy;
        }
        if (newX >= CANVAS_WIDTH) {
          score1++;
          if (score1 >= WIN_SCORE) {
            // Player 1 wins
            channelRef.current?.send({
              type: 'broadcast',
              event: 'game_over',
              payload: { winner: 'player1', score1, score2 },
            });
            return { ...prev, score1, score2, gameStarted: false, gameOver: true, winner: 'player1' };
          }
          const reset = resetBall();
          newX = reset.x;
          newY = reset.y;
          newVx = reset.vx;
          newVy = reset.vy;
        }

        const newBall = { x: newX, y: newY, vx: newVx, vy: newVy };
        
        // Broadcast ball position
        channelRef.current?.send({
          type: 'broadcast',
          event: 'ball_update',
          payload: { ball: newBall, score1, score2 },
        });

        return { ...prev, ball: newBall, score1, score2 };
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isHost, gameState.gameStarted, resetBall]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with solid color (not CSS variable)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles - white color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, gameState.paddle1, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, gameState.paddle2, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball - bright color
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(gameState.ball.x + BALL_SIZE / 2, gameState.ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Scores
    ctx.font = '48px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.score1.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(gameState.score2.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Game over overlay
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const winnerText = (gameState.winner === 'player1' && isHost) || (gameState.winner === 'player2' && !isHost) 
        ? 'You Win!' 
        : 'You Lose!';
      ctx.fillText(winnerText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.font = '24px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('First to 10 wins', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
  }, [gameState]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // Auto-join room from URL parameters
  useEffect(() => {
    if (!user || !initialRoomCode) return;
    
    if (initialIsHost) {
      // Host: create the room with the specified code
      setRoomId(initialRoomCode);
      setIsHost(true);
      setWaiting(true);
      joinChannel(initialRoomCode, true);
    } else {
      // Guest: join the room
      joinRoom(initialRoomCode);
    }
  }, [user, initialRoomCode, initialIsHost]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 mb-2">
        <Badge variant="outline" className="text-lg px-4 py-2">
          {user?.username || 'You'}: {isHost ? gameState.score1 : gameState.score2}
        </Badge>
        <span className="text-muted-foreground">vs</span>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {opponent || 'Opponent'}: {isHost ? gameState.score2 : gameState.score1}
        </Badge>
      </div>

      <Card className="p-1 bg-muted/50">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border border-border"
        />
      </Card>

      {gameState.gameOver && (
        <div className="flex flex-col items-center gap-4">
          <Button onClick={requestPlayAgain} disabled={gameState.playAgainRequested} className="gap-2">
            <Play className="h-4 w-4" />
            {gameState.playAgainRequested 
              ? (gameState.opponentPlayAgainRequested ? 'Starting...' : 'Waiting for opponent...') 
              : 'Play Again'}
          </Button>
          {gameState.opponentPlayAgainRequested && !gameState.playAgainRequested && (
            <p className="text-sm text-muted-foreground">Opponent wants to play again!</p>
          )}
        </div>
      )}

      {!gameState.gameStarted && !gameState.gameOver && (
        <div className="flex flex-col items-center gap-4">
          {waiting ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for opponent...</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="text-sm">Room Code: </span>
                <span className="font-mono font-bold text-primary">{roomId?.replace('pong_', '')}</span>
              </div>
              <p className="text-xs">Share this code with a friend to play together</p>
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <Button onClick={createRoom} className="gap-2">
                  <Play className="h-4 w-4" />
                  Create Room
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter room code"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      joinRoom((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  if (input.value) joinRoom(input.value);
                }}>
                  <Users className="h-4 w-4 mr-1" />
                  Join
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Use mouse, arrow keys (↑/↓), or W/S to control your paddle
      </p>
    </div>
  );
};

export default PongGame;
