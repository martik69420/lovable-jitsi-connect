import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Play, Users, Loader2 } from 'lucide-react';

interface PongGameProps {
  onGameEnd?: (score: number) => void;
}

interface GameState {
  ball: { x: number; y: number; vx: number; vy: number };
  paddle1: number;
  paddle2: number;
  score1: number;
  score2: number;
  gameStarted: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;

const PongGame: React.FC<PongGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: 4, vy: 4 },
    paddle1: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    paddle2: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    score1: 0,
    score2: 0,
    gameStarted: false,
  });
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

  const createRoom = async () => {
    if (!user) return;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const username = user.username || user.displayName || 'player';
    const shortName = username.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
    const newRoomId = `${shortName}${randomNum}`;
    setRoomId(newRoomId);
    setIsHost(true);
    setWaiting(true);
    joinChannel(newRoomId, true);
  };

  const joinRoom = async (id: string) => {
    if (!user) return;
    setRoomId(id);
    setIsHost(false);
    joinChannel(id, false);
  };

  const joinChannel = (id: string, host: boolean) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`pong_${id}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'player_join' }, ({ payload }) => {
        if (host && payload.userId !== user?.id) {
          setOpponent(payload.username);
          setWaiting(false);
          channel.send({
            type: 'broadcast',
            event: 'game_start',
            payload: { hostId: user?.id, hostUsername: user?.username },
          });
          setGameState(prev => ({ ...prev, gameStarted: true }));
        }
      })
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        if (!host) {
          setOpponent(payload.hostUsername);
          setGameState(prev => ({ ...prev, gameStarted: true }));
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
      .subscribe(() => {
        if (!host) {
          channel.send({
            type: 'broadcast',
            event: 'player_join',
            payload: { userId: user?.id, username: user?.username },
          });
        }
      });

    channelRef.current = channel;
  };

  // Handle paddle movement
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

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameState.gameStarted, isHost]);

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
          const reset = resetBall();
          newX = reset.x;
          newY = reset.y;
          newVx = reset.vx;
          newVy = reset.vy;
        }
        if (newX >= CANVAS_WIDTH) {
          score1++;
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

    // Clear
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.3)';
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fillRect(10, gameState.paddle1, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, gameState.paddle2, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = 'hsl(var(--foreground))';
    ctx.beginPath();
    ctx.arc(gameState.ball.x + BALL_SIZE / 2, gameState.ball.y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Scores
    ctx.font = '48px sans-serif';
    ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.score1.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(gameState.score2.toString(), (CANVAS_WIDTH * 3) / 4, 60);
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

      {!gameState.gameStarted && (
        <div className="flex flex-col items-center gap-4">
          {waiting ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for opponent... Room: {roomId}</span>
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
                  placeholder="Enter room ID"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      joinRoom((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Move your mouse up and down to control your paddle
      </p>
    </div>
  );
};

export default PongGame;
