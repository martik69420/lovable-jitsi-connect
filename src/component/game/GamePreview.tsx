import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/component/ui/badge';
import { Button } from '@/component/ui/button';
import { 
  Terminal, 
  Gamepad, 
  Rocket, 
  Circle,
  Play,
  Swords,
  Users
} from 'lucide-react';

interface GamePreviewProps {
  gameType: 'snake' | 'tetris' | 'pong' | 'asteroids' | 'geometrydash';
  compact?: boolean;
  roomCode?: string;
}

const gameData = {
  snake: {
    name: 'Snake',
    description: 'Classic snake game - eat food and grow!',
    icon: Terminal,
    gradient: 'from-emerald-500/20 to-green-600/10',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    route: '/games/snake'
  },
  tetris: {
    name: 'Tetris',
    description: 'Stack blocks and clear lines!',
    icon: Gamepad,
    gradient: 'from-purple-500/20 to-violet-600/10',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
    route: '/games/tetris'
  },
  pong: {
    name: 'Pong',
    description: 'Classic 2-player ping pong',
    icon: Circle,
    gradient: 'from-blue-500/20 to-cyan-600/10',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    route: '/games/pong'
  },
  asteroids: {
    name: 'Asteroids',
    description: 'Team up to destroy asteroids!',
    icon: Rocket,
    gradient: 'from-orange-500/20 to-amber-600/10',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-500',
    buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    route: '/games/asteroids'
  },
  geometrydash: {
    name: 'Geometry Dash',
    description: 'Rhythm-based platformer!',
    icon: Gamepad,
    gradient: 'from-yellow-500/20 to-amber-500/10',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-500',
    buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    route: '/games/geometry-dash'
  }
};

const GamePreview: React.FC<GamePreviewProps> = ({ gameType, compact = true, roomCode }) => {
  const navigate = useNavigate();
  const game = gameData[gameType];
  
  if (!game) {
    return (
      <div className="rounded-xl border border-destructive/20 p-3 text-center">
        <p className="text-destructive text-xs">Game not found</p>
      </div>
    );
  }

  const Icon = game.icon;
  const isInvite = !!roomCode;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (roomCode) {
      navigate(`${game.route}?room=${roomCode}`);
    } else {
      navigate(game.route);
    }
  };

  return (
    <div
      className={`w-full max-w-[280px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-border/50`}
      onClick={handlePlay}
    >
      {/* Header gradient strip */}
      <div className={`bg-gradient-to-r ${game.gradient} px-4 py-3 flex items-center gap-3`}>
        <div className={`p-2 rounded-xl ${game.iconBg} backdrop-blur-sm`}>
          <Icon className={`h-5 w-5 ${game.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm">{game.name}</h4>
          <p className="text-[11px] text-muted-foreground truncate">
            {game.description}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 bg-card/80 backdrop-blur-sm">
        {isInvite ? (
          <div className="flex items-center gap-2 mb-3">
            <Swords className={`h-4 w-4 ${game.iconColor} shrink-0`} />
            <p className="text-xs font-medium">
              You've been challenged!
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {gameType === 'pong' ? '2 players' : gameType === 'tetris' ? 'Single player' : 'Multiplayer'}
            </p>
          </div>
        )}

        <Button 
          size="sm" 
          className={`w-full h-8 text-xs font-semibold gap-1.5 rounded-lg ${game.buttonClass}`}
          onClick={handlePlay}
        >
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          {isInvite ? 'Join Game' : 'Play Now'}
        </Button>
      </div>
    </div>
  );
};

export default GamePreview;
