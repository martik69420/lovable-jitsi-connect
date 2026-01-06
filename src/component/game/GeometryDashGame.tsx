import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Play, Pause, RotateCcw, Square, Triangle, Circle, Pencil, Save, Upload, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/component/ui/tabs';
import { ScrollArea } from '@/component/ui/scroll-area';
import { Input } from '@/component/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/component/ui/dialog';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_HEIGHT = 50;
const PLAYER_SIZE = 30;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const GAME_SPEED = 6;

interface Obstacle {
  type: 'spike' | 'block' | 'platform' | 'portal' | 'coin';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Level {
  id: string;
  name: string;
  obstacles: Obstacle[];
  creator: string;
  creatorId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'insane';
  plays: number;
}

// Pre-built levels
const BUILT_IN_LEVELS: Level[] = [
  {
    id: 'level1',
    name: 'Stereo Madness',
    difficulty: 'easy',
    creator: 'System',
    creatorId: 'system',
    plays: 0,
    obstacles: [
      { type: 'spike', x: 400, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'block', x: 600, y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, width: 40, height: 40 },
      { type: 'coin', x: 650, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100, width: 20, height: 20 },
      { type: 'spike', x: 800, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 830, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'platform', x: 1000, y: CANVAS_HEIGHT - GROUND_HEIGHT - 80, width: 100, height: 15 },
      { type: 'coin', x: 1030, y: CANVAS_HEIGHT - GROUND_HEIGHT - 120, width: 20, height: 20 },
      { type: 'block', x: 1200, y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, width: 40, height: 40 },
      { type: 'block', x: 1240, y: CANVAS_HEIGHT - GROUND_HEIGHT - 80, width: 40, height: 80 },
      { type: 'spike', x: 1400, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'portal', x: 1600, y: CANVAS_HEIGHT - GROUND_HEIGHT - 60, width: 30, height: 60 },
    ]
  },
  {
    id: 'level2',
    name: 'Back On Track',
    difficulty: 'medium',
    creator: 'System',
    creatorId: 'system',
    plays: 0,
    obstacles: [
      { type: 'block', x: 300, y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, width: 40, height: 40 },
      { type: 'spike', x: 350, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 380, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'platform', x: 500, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100, width: 80, height: 15 },
      { type: 'coin', x: 520, y: CANVAS_HEIGHT - GROUND_HEIGHT - 140, width: 20, height: 20 },
      { type: 'spike', x: 700, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'block', x: 750, y: CANVAS_HEIGHT - GROUND_HEIGHT - 80, width: 40, height: 80 },
      { type: 'spike', x: 800, y: CANVAS_HEIGHT - GROUND_HEIGHT - 105, width: 30, height: 25 },
      { type: 'block', x: 950, y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, width: 40, height: 40 },
      { type: 'block', x: 990, y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, width: 40, height: 40 },
      { type: 'spike', x: 1030, y: CANVAS_HEIGHT - GROUND_HEIGHT - 65, width: 30, height: 25 },
      { type: 'portal', x: 1200, y: CANVAS_HEIGHT - GROUND_HEIGHT - 60, width: 30, height: 60 },
      { type: 'coin', x: 1250, y: CANVAS_HEIGHT - GROUND_HEIGHT - 80, width: 20, height: 20 },
      { type: 'spike', x: 1400, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 1430, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 1460, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
    ]
  },
  {
    id: 'level3',
    name: 'Polargeist',
    difficulty: 'hard',
    creator: 'System',
    creatorId: 'system',
    plays: 0,
    obstacles: [
      { type: 'spike', x: 250, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 280, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'block', x: 350, y: CANVAS_HEIGHT - GROUND_HEIGHT - 60, width: 40, height: 60 },
      { type: 'spike', x: 400, y: CANVAS_HEIGHT - GROUND_HEIGHT - 85, width: 30, height: 25 },
      { type: 'coin', x: 450, y: CANVAS_HEIGHT - GROUND_HEIGHT - 120, width: 20, height: 20 },
      { type: 'platform', x: 500, y: CANVAS_HEIGHT - GROUND_HEIGHT - 120, width: 60, height: 15 },
      { type: 'spike', x: 600, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'block', x: 650, y: CANVAS_HEIGHT - GROUND_HEIGHT - 100, width: 40, height: 100 },
      { type: 'spike', x: 700, y: CANVAS_HEIGHT - GROUND_HEIGHT - 125, width: 30, height: 25 },
      { type: 'portal', x: 800, y: CANVAS_HEIGHT - GROUND_HEIGHT - 60, width: 30, height: 60 },
      { type: 'spike', x: 900, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 930, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'spike', x: 960, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
      { type: 'block', x: 1050, y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, width: 80, height: 40 },
      { type: 'coin', x: 1070, y: CANVAS_HEIGHT - GROUND_HEIGHT - 80, width: 20, height: 20 },
      { type: 'spike', x: 1150, y: CANVAS_HEIGHT - GROUND_HEIGHT - 25, width: 30, height: 25 },
    ]
  },
];

const GeometryDashGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [progress, setProgress] = useState(0);
  
  // Player state
  const playerRef = useRef({
    x: 100,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
    vy: 0,
    isJumping: false,
    rotation: 0,
  });
  
  // Level state
  const [currentLevel, setCurrentLevel] = useState<Level>(BUILT_IN_LEVELS[0]);
  const [customLevels, setCustomLevels] = useState<Level[]>([]);
  const [communityLevels, setCommunityLevels] = useState<Level[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editorObstacles, setEditorObstacles] = useState<Obstacle[]>([]);
  const [selectedTool, setSelectedTool] = useState<'spike' | 'block' | 'platform' | 'portal' | 'coin'>('spike');
  const [levelName, setLevelName] = useState('My Level');
  const [levelDifficulty, setLevelDifficulty] = useState<'easy' | 'medium' | 'hard' | 'insane'>('medium');
  const [editorScroll, setEditorScroll] = useState(0);
  
  // Multiplayer state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<Map<string, { x: number; y: number; progress: number; username: string }>>(new Map());
  const channelRef = useRef<any>(null);
  
  const cameraOffset = useRef(0);
  const gameLoopRef = useRef<number>();
  const collectedCoins = useRef<Set<number>>(new Set());

  // Fetch community levels
  useEffect(() => {
    fetchCommunityLevels();
  }, []);

  const fetchCommunityLevels = async () => {
    setLoadingLevels(true);
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('game_type', 'geometry_dash_level')
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;

      const levels: Level[] = (data || []).map((record: any) => {
        try {
          const levelData = typeof record.score === 'string' 
            ? JSON.parse(record.score) 
            : record.score;
          return levelData as Level;
        } catch {
          return null;
        }
      }).filter(Boolean);

      setCommunityLevels(levels);
    } catch (error) {
      console.error('Error fetching levels:', error);
    } finally {
      setLoadingLevels(false);
    }
  };

  const resetGame = useCallback(() => {
    playerRef.current = {
      x: 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      vy: 0,
      isJumping: false,
      rotation: 0,
    };
    cameraOffset.current = 0;
    collectedCoins.current = new Set();
    setScore(0);
    setCoins(0);
    setProgress(0);
    setGameOver(false);
    setPaused(false);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameStarted(true);
    setAttempt(prev => prev + 1);
  }, [resetGame]);

  const jump = useCallback(() => {
    const player = playerRef.current;
    if (!player.isJumping && gameStarted && !gameOver && !paused) {
      player.vy = JUMP_FORCE;
      player.isJumping = true;
    }
  }, [gameStarted, gameOver, paused]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'Escape') {
        setPaused(prev => !prev);
      }
    };

    const handleClick = () => {
      if (gameStarted && !isEditing) {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [jump, gameStarted, isEditing]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || paused || isEditing) return;

    const gameLoop = () => {
      const player = playerRef.current;
      
      // Apply gravity
      player.vy += GRAVITY;
      player.y += player.vy;

      // Ground collision
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
      if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isJumping = false;
      }

      // Update camera
      cameraOffset.current += GAME_SPEED;
      player.rotation += 5;

      // Calculate progress
      const levelLength = Math.max(...currentLevel.obstacles.map(o => o.x + o.width), 2000);
      const newProgress = Math.min((cameraOffset.current / levelLength) * 100, 100);
      setProgress(newProgress);

      // Check collisions
      const playerRect = {
        x: player.x,
        y: player.y,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
      };

      for (let i = 0; i < currentLevel.obstacles.length; i++) {
        const obs = currentLevel.obstacles[i];
        const obsX = obs.x - cameraOffset.current;
        
        // Skip if off screen
        if (obsX > CANVAS_WIDTH + 100 || obsX < -100) continue;

        const obsRect = {
          x: obsX,
          y: obs.y,
          width: obs.width,
          height: obs.height,
        };

        // Check collision
        if (
          playerRect.x < obsRect.x + obsRect.width &&
          playerRect.x + playerRect.width > obsRect.x &&
          playerRect.y < obsRect.y + obsRect.height &&
          playerRect.y + playerRect.height > obsRect.y
        ) {
          if (obs.type === 'coin' && !collectedCoins.current.has(i)) {
            collectedCoins.current.add(i);
            setCoins(prev => prev + 1);
            setScore(prev => prev + 50);
          } else if (obs.type === 'spike') {
            setGameOver(true);
            return;
          } else if (obs.type === 'block' || obs.type === 'platform') {
            // Landing on top of block
            if (player.vy > 0 && playerRect.y + playerRect.height - player.vy <= obsRect.y) {
              player.y = obsRect.y - PLAYER_SIZE;
              player.vy = 0;
              player.isJumping = false;
            } else {
              setGameOver(true);
              return;
            }
          } else if (obs.type === 'portal') {
            // Level complete
            setScore(prev => prev + 1000);
            setGameOver(true);
            toast({
              title: "Level Complete!",
              description: `Score: ${score + 1000} | Coins: ${coins}`,
            });
            return;
          }
        }
      }

      // Broadcast position to other players
      if (channelRef.current && user) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'player_update',
          payload: {
            userId: user.id,
            username: user.username || 'Player',
            x: player.x,
            y: player.y,
            progress: newProgress,
          },
        });
      }

      setScore(prev => prev + 1);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, paused, isEditing, currentLevel, coins, score, user, toast]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient (like Geometry Dash)
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = -cameraOffset.current % 50; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Ground
    ctx.fillStyle = '#e4a72c';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Ground pattern
    ctx.fillStyle = '#d49b1f';
    for (let x = -cameraOffset.current % 40; x < CANVAS_WIDTH; x += 40) {
      ctx.fillRect(x, CANVAS_HEIGHT - GROUND_HEIGHT, 20, 5);
    }

    const obstacles = isEditing ? editorObstacles : currentLevel.obstacles;
    const offset = isEditing ? editorScroll : cameraOffset.current;

    // Draw obstacles
    obstacles.forEach((obs, index) => {
      const x = obs.x - offset;
      if (x > CANVAS_WIDTH + 100 || x < -100) return;

      ctx.save();
      
      if (obs.type === 'spike') {
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(x + obs.width / 2, obs.y);
        ctx.lineTo(x, obs.y + obs.height);
        ctx.lineTo(x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff6b81';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (obs.type === 'block') {
        ctx.fillStyle = '#5352ed';
        ctx.fillRect(x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#7b7bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, obs.y, obs.width, obs.height);
      } else if (obs.type === 'platform') {
        ctx.fillStyle = '#2ed573';
        ctx.fillRect(x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#7bed9f';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, obs.y, obs.width, obs.height);
      } else if (obs.type === 'portal') {
        ctx.fillStyle = '#ff6b81';
        ctx.beginPath();
        ctx.ellipse(x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Inner glow
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x + obs.width / 2, obs.y + obs.height / 2, obs.width / 4, obs.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'coin') {
        if (!collectedCoins.current.has(index) || isEditing) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffed4a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      
      ctx.restore();
    });

    // Draw other players (multiplayer)
    otherPlayers.forEach((otherPlayer) => {
      ctx.save();
      ctx.translate(otherPlayer.x, otherPlayer.y + PLAYER_SIZE / 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
      ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.restore();
      
      // Username
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(otherPlayer.username, otherPlayer.x, otherPlayer.y - 10);
    });

    // Draw player
    if (!isEditing) {
      const player = playerRef.current;
      ctx.save();
      ctx.translate(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2);
      ctx.rotate((player.rotation * Math.PI) / 180);
      
      // Player cube with glow
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.shadowBlur = 0;
      
      // Inner detail
      ctx.strokeStyle = '#00cc6a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      
      // Face
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-5, -3, 4, 0, Math.PI * 2);
      ctx.arc(5, -3, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // Progress bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, CANVAS_WIDTH - 20, 10);
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(10, 10, (CANVAS_WIDTH - 20) * (progress / 100), 10);

  }, [currentLevel, editorObstacles, isEditing, editorScroll, progress, otherPlayers]);

  // Editor click handler
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + editorScroll;
    const y = e.clientY - rect.top;
    
    // Don't place on ground
    if (y > CANVAS_HEIGHT - GROUND_HEIGHT - 10) return;
    
    const newObstacle: Obstacle = {
      type: selectedTool,
      x: Math.round(x / 20) * 20,
      y: selectedTool === 'spike' 
        ? CANVAS_HEIGHT - GROUND_HEIGHT - 25 
        : Math.round(y / 20) * 20,
      width: selectedTool === 'platform' ? 80 : selectedTool === 'coin' ? 20 : 30,
      height: selectedTool === 'spike' ? 25 : selectedTool === 'platform' ? 15 : selectedTool === 'coin' ? 20 : 40,
    };
    
    setEditorObstacles(prev => [...prev, newObstacle]);
  }, [isEditing, selectedTool, editorScroll]);

  // Save level
  const saveLevel = async () => {
    if (!user) {
      toast({ title: "Please log in to save levels", variant: "destructive" });
      return;
    }
    
    const level: Level = {
      id: `custom_${Date.now()}`,
      name: levelName,
      obstacles: editorObstacles,
      creator: user.username || 'Anonymous',
      creatorId: user.id,
      difficulty: levelDifficulty,
      plays: 0,
    };
    
    try {
      const { error } = await supabase
        .from('game_history')
        .insert({
          user_id: user.id,
          game_type: 'geometry_dash_level',
          score: JSON.stringify(level) as unknown as number,
        });
      
      if (error) throw error;
      
      toast({ title: "Level saved!", description: "Your level has been saved to the community." });
      fetchCommunityLevels();
    } catch (error) {
      console.error('Error saving level:', error);
      toast({ title: "Error saving level", variant: "destructive" });
    }
  };

  // Multiplayer functions
  const createRoom = async () => {
    if (!user) return;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const username = user.username || 'player';
    const shortName = username.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, '');
    const newRoomId = `gd_${shortName}${randomNum}`;
    setRoomId(newRoomId);
    setIsHost(true);
    setWaiting(true);
    joinChannel(newRoomId);
  };

  const joinRoom = async (id: string) => {
    if (!user) return;
    setRoomId(id);
    setIsHost(false);
    joinChannel(id);
  };

  const joinChannel = (id: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`geometrydash_${id}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'player_join' }, ({ payload }) => {
        setOtherPlayers(prev => {
          const next = new Map(prev);
          next.set(payload.userId, {
            x: 100,
            y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
            progress: 0,
            username: payload.username,
          });
          return next;
        });
        setWaiting(false);
      })
      .on('broadcast', { event: 'player_update' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setOtherPlayers(prev => {
            const next = new Map(prev);
            next.set(payload.userId, {
              x: payload.x,
              y: payload.y,
              progress: payload.progress,
              username: payload.username,
            });
            return next;
          });
        }
      })
      .on('broadcast', { event: 'start_game' }, () => {
        startGame();
      })
      .subscribe(() => {
        channel.send({
          type: 'broadcast',
          event: 'player_join',
          payload: { userId: user?.id, username: user?.username || 'Player' },
        });
      });

    channelRef.current = channel;
  };

  const startMultiplayerGame = () => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'start_game',
      payload: {},
    });
    startGame();
  };

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
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-[800px]">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Score: {score}
          </Badge>
          <Badge variant="secondary" className="px-4 py-2">
            Coins: {coins}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Attempt: {attempt}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(!isEditing);
              setGameStarted(false);
              resetGame();
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            {isEditing ? 'Play Mode' : 'Editor'}
          </Button>
        </div>
      </div>

      {/* Game Canvas */}
      <Card className="p-1 bg-muted/50">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg border border-border cursor-pointer"
          onClick={handleEditorClick}
        />
      </Card>

      {/* Editor Controls */}
      {isEditing && (
        <div className="flex flex-col gap-4 w-full max-w-[800px]">
          <div className="flex items-center gap-4 justify-between">
            <div className="flex gap-2">
              <Button
                variant={selectedTool === 'spike' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('spike')}
              >
                <Triangle className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'block' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('block')}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'platform' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('platform')}
              >
                Platform
              </Button>
              <Button
                variant={selectedTool === 'portal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('portal')}
              >
                Portal
              </Button>
              <Button
                variant={selectedTool === 'coin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('coin')}
              >
                <Circle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditorScroll(prev => Math.max(0, prev - 200))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditorScroll(prev => prev + 200)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Input
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              placeholder="Level name"
              className="max-w-[200px]"
            />
            <select
              value={levelDifficulty}
              onChange={(e) => setLevelDifficulty(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="insane">Insane</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => setEditorObstacles([])}>
              Clear
            </Button>
            <Button size="sm" onClick={saveLevel}>
              <Save className="h-4 w-4 mr-1" />
              Save Level
            </Button>
          </div>
        </div>
      )}

      {/* Game Controls */}
      {!isEditing && (
        <div className="flex flex-col items-center gap-4">
          {!gameStarted ? (
            <div className="flex flex-col items-center gap-4">
              {/* Level Selection */}
              <Tabs defaultValue="official" className="w-full max-w-[800px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="official">Official</TabsTrigger>
                  <TabsTrigger value="community">Community</TabsTrigger>
                  <TabsTrigger value="multiplayer">Multiplayer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="official">
                  <ScrollArea className="h-[200px]">
                    <div className="grid gap-2 p-2">
                      {BUILT_IN_LEVELS.map((level) => (
                        <div
                          key={level.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            currentLevel.id === level.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                          }`}
                          onClick={() => setCurrentLevel(level)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{level.name}</span>
                            <Badge variant={
                              level.difficulty === 'easy' ? 'secondary' :
                              level.difficulty === 'medium' ? 'default' :
                              level.difficulty === 'hard' ? 'destructive' : 'outline'
                            }>
                              {level.difficulty}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="community">
                  <ScrollArea className="h-[200px]">
                    {loadingLevels ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : communityLevels.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No community levels yet. Be the first to create one!
                      </div>
                    ) : (
                      <div className="grid gap-2 p-2">
                        {communityLevels.map((level) => (
                          <div
                            key={level.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              currentLevel.id === level.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                            }`}
                            onClick={() => setCurrentLevel(level)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{level.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">by {level.creator}</span>
                              </div>
                              <Badge variant={
                                level.difficulty === 'easy' ? 'secondary' :
                                level.difficulty === 'medium' ? 'default' :
                                level.difficulty === 'hard' ? 'destructive' : 'outline'
                              }>
                                {level.difficulty}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="multiplayer">
                  <div className="p-4 space-y-4">
                    {waiting ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Waiting for players... Room: {roomId}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Players: {otherPlayers.size + 1}
                        </div>
                        {isHost && (
                          <Button onClick={startMultiplayerGame}>
                            Start Race
                          </Button>
                        )}
                      </div>
                    ) : roomId ? (
                      <div className="text-center">
                        <p className="text-muted-foreground">Connected to room: {roomId}</p>
                        <p className="text-sm">Players: {otherPlayers.size + 1}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Button onClick={createRoom} className="gap-2">
                          <Play className="h-4 w-4" />
                          Create Room
                        </Button>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter room ID"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                joinRoom((e.target as HTMLInputElement).value);
                              }
                            }}
                          />
                          <Button variant="outline" size="icon">
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Button onClick={startGame} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Play {currentLevel.name}
              </Button>
            </div>
          ) : gameOver ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-xl font-bold">
                {progress >= 100 ? '🎉 Level Complete!' : '💥 Game Over!'}
              </div>
              <div className="text-muted-foreground">
                Progress: {progress.toFixed(1)}% | Score: {score}
              </div>
              <div className="flex gap-2">
                <Button onClick={startGame} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </Button>
                <Button variant="outline" onClick={() => {
                  setGameStarted(false);
                  resetGame();
                  setAttempt(0);
                }}>
                  Level Select
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button variant="outline" size="sm" onClick={() => setPaused(!paused)}>
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <p className="text-sm text-muted-foreground">
                Press SPACE or click to jump
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeometryDashGame;
