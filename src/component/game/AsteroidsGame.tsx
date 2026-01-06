import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Play, Users, Loader2, Rocket } from 'lucide-react';

interface AsteroidsGameProps {
  onGameEnd?: (score: number) => void;
}

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  id: string;
  username: string;
  health: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  id: string;
}

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

const AsteroidsGame: React.FC<AsteroidsGameProps> = ({ onGameEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [players, setPlayers] = useState<Map<string, Ship>>(new Map());
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const keysRef = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();
  const channelRef = useRef<any>(null);
  const shipRef = useRef<Ship | null>(null);

  const createAsteroid = useCallback(() => {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    switch (side) {
      case 0: x = 0; y = Math.random() * CANVAS_HEIGHT; break;
      case 1: x = CANVAS_WIDTH; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = 0; break;
      default: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT;
    }
    
    vx = (Math.random() - 0.5) * 3;
    vy = (Math.random() - 0.5) * 3;
    
    return {
      x, y, vx, vy,
      size: 20 + Math.random() * 30,
      id: `asteroid_${Date.now()}_${Math.random()}`,
    };
  }, []);

  const initShip = useCallback(() => {
    if (!user) return null;
    return {
      x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
      y: CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 200,
      angle: Math.random() * Math.PI * 2,
      vx: 0,
      vy: 0,
      id: user.id,
      username: user.username || 'Player',
      health: 100,
    };
  }, [user]);

  const createRoom = async () => {
    if (!user) return;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const username = user.username || user.displayName || 'player';
    const shortName = username.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
    const newRoomId = `ast_${shortName}${randomNum}`;
    setRoomId(newRoomId);
    setIsHost(true);
    setWaiting(true);
    
    const ship = initShip();
    if (ship) {
      shipRef.current = ship;
      setPlayers(new Map([[user.id, ship]]));
    }
    
    joinChannel(newRoomId, true);
  };

  const joinRoom = async (id: string) => {
    if (!user) return;
    const roomIdToJoin = id.startsWith('ast_') ? id : `ast_${id}`;
    setRoomId(roomIdToJoin);
    setIsHost(false);
    
    const ship = initShip();
    if (ship) {
      shipRef.current = ship;
    }
    
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
        setPlayers(prev => {
          const next = new Map(prev);
          next.set(payload.ship.id, payload.ship);
          return next;
        });
        
        if (host) {
          setWaiting(false);
          // Send current game state to new player
          channel.send({
            type: 'broadcast',
            event: 'game_state',
            payload: { 
              asteroids, 
              players: Array.from(players.entries()),
              gameStarted: true,
            },
          });
        }
      })
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        if (!host) {
          setAsteroids(payload.asteroids);
          setPlayers(new Map(payload.players));
          setGameStarted(payload.gameStarted);
        }
      })
      .on('broadcast', { event: 'player_update' }, ({ payload }) => {
        if (payload.ship.id !== user?.id) {
          setPlayers(prev => {
            const next = new Map(prev);
            next.set(payload.ship.id, payload.ship);
            return next;
          });
        }
      })
      .on('broadcast', { event: 'bullet_fired' }, ({ payload }) => {
        setBullets(prev => [...prev, payload.bullet]);
      })
      .on('broadcast', { event: 'asteroid_destroyed' }, ({ payload }) => {
        setAsteroids(prev => prev.filter(a => a.id !== payload.asteroidId));
        if (payload.destroyerId === user?.id) {
          setScore(prev => prev + 10);
        }
      })
      .on('broadcast', { event: 'asteroids_update' }, ({ payload }) => {
        if (!host) {
          setAsteroids(payload.asteroids);
        }
      })
      .on('broadcast', { event: 'start_game' }, () => {
        setGameStarted(true);
        setWaiting(false);
      })
      .subscribe(() => {
        if (!host && shipRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'player_join',
            payload: { ship: shipRef.current },
          });
        }
      });

    channelRef.current = channel;
  };

  const startGame = () => {
    // Initialize asteroids
    const initialAsteroids = Array.from({ length: 5 }, () => createAsteroid());
    setAsteroids(initialAsteroids);
    setGameStarted(true);
    setWaiting(false);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'start_game',
      payload: {},
    });
  };

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === ' ' && shipRef.current && gameStarted && !gameOver) {
        const bullet: Bullet = {
          x: shipRef.current.x + Math.cos(shipRef.current.angle) * 20,
          y: shipRef.current.y + Math.sin(shipRef.current.angle) * 20,
          vx: Math.cos(shipRef.current.angle) * 8,
          vy: Math.sin(shipRef.current.angle) * 8,
          ownerId: shipRef.current.id,
        };
        setBullets(prev => [...prev, bullet]);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'bullet_fired',
          payload: { bullet },
        });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      // Update ship
      if (shipRef.current) {
        const ship = shipRef.current;
        
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          ship.angle -= 0.1;
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          ship.angle += 0.1;
        }
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) {
          ship.vx += Math.cos(ship.angle) * 0.2;
          ship.vy += Math.sin(ship.angle) * 0.2;
        }

        ship.x += ship.vx;
        ship.y += ship.vy;
        ship.vx *= 0.99;
        ship.vy *= 0.99;

        // Wrap around
        if (ship.x < 0) ship.x = CANVAS_WIDTH;
        if (ship.x > CANVAS_WIDTH) ship.x = 0;
        if (ship.y < 0) ship.y = CANVAS_HEIGHT;
        if (ship.y > CANVAS_HEIGHT) ship.y = 0;

        setPlayers(prev => {
          const next = new Map(prev);
          next.set(ship.id, { ...ship });
          return next;
        });

        channelRef.current?.send({
          type: 'broadcast',
          event: 'player_update',
          payload: { ship },
        });
      }

      // Update bullets
      setBullets(prev => prev.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        return b.x >= 0 && b.x <= CANVAS_WIDTH && b.y >= 0 && b.y <= CANVAS_HEIGHT;
      }));

      // Host manages asteroids
      if (isHost) {
        setAsteroids(prev => {
          const updated = prev.map(a => ({
            ...a,
            x: (a.x + a.vx + CANVAS_WIDTH) % CANVAS_WIDTH,
            y: (a.y + a.vy + CANVAS_HEIGHT) % CANVAS_HEIGHT,
          }));

          // Spawn new asteroids occasionally
          if (Math.random() < 0.01 && updated.length < 15) {
            updated.push(createAsteroid());
          }

          return updated;
        });

        // Broadcast asteroids periodically
        if (Math.random() < 0.1) {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'asteroids_update',
            payload: { asteroids },
          });
        }
      }

      // Collision detection
      setBullets(prevBullets => {
        const remainingBullets = [...prevBullets];
        
        setAsteroids(prevAsteroids => {
          return prevAsteroids.filter(asteroid => {
            const bulletIndex = remainingBullets.findIndex(bullet => {
              const dx = bullet.x - asteroid.x;
              const dy = bullet.y - asteroid.y;
              return Math.sqrt(dx * dx + dy * dy) < asteroid.size;
            });

            if (bulletIndex !== -1) {
              const bullet = remainingBullets[bulletIndex];
              remainingBullets.splice(bulletIndex, 1);
              
              if (bullet.ownerId === user?.id) {
                setScore(prev => prev + 10);
              }

              channelRef.current?.send({
                type: 'broadcast',
                event: 'asteroid_destroyed',
                payload: { asteroidId: asteroid.id, destroyerId: bullet.ownerId },
              });
              return false;
            }
            return true;
          });
        });

        return remainingBullets;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, isHost, createAsteroid, asteroids, user?.id]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with space background
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = 'hsl(var(--muted-foreground) / 0.2)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        (i * 137) % CANVAS_WIDTH,
        (i * 97) % CANVAS_HEIGHT,
        1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Asteroids
    ctx.strokeStyle = 'hsl(var(--muted-foreground))';
    ctx.lineWidth = 2;
    asteroids.forEach(asteroid => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = asteroid.size * (0.8 + Math.sin(i * 5) * 0.2);
        const x = asteroid.x + Math.cos(angle) * radius;
        const y = asteroid.y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Ships
    players.forEach(ship => {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      
      ctx.fillStyle = ship.id === user?.id ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      // Username
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.textAlign = 'center';
      ctx.fillText(ship.username, ship.x, ship.y - 20);
    });

    // Bullets
    ctx.fillStyle = 'hsl(var(--foreground))';
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [players, asteroids, bullets, user?.id]);

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
          <Rocket className="h-4 w-4 mr-2" />
          Score: {score}
        </Badge>
        <Badge variant="secondary" className="px-4 py-2">
          Players: {players.size}
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

      {!gameStarted && (
        <div className="flex flex-col items-center gap-4">
          {waiting ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for players...</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="text-sm">Room Code: </span>
                <span className="font-mono font-bold text-primary">{roomId?.replace('ast_', '')}</span>
              </div>
              <p className="text-xs text-muted-foreground">Share this code with friends • Players: {players.size}</p>
              <Button onClick={startGame} variant="secondary" className="mt-2">
                Start with Current Players
              </Button>
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

      <div className="text-sm text-muted-foreground text-center">
        <p>Arrow keys or WASD to move • Space to shoot</p>
      </div>
    </div>
  );
};

export default AsteroidsGame;
