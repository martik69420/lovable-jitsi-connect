import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/component/ui/card';
import { Badge } from '@/component/ui/badge';
import { Button } from '@/component/ui/button';
import { 
  Terminal, 
  Gamepad, 
  Rocket, 
  Circle,
  Play,
  ExternalLink
} from 'lucide-react';

interface GamePreviewProps {
  gameType: 'snake' | 'tetris' | 'pong' | 'asteroids';
  compact?: boolean;
}

const gameData = {
  snake: {
    name: 'Snake',
    description: 'Classic snake game - eat food and grow!',
    icon: Terminal,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    route: '/games/snake'
  },
  tetris: {
    name: 'Tetris',
    description: 'Stack blocks and clear lines!',
    icon: Gamepad,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    route: '/games/tetris'
  },
  pong: {
    name: 'Pong',
    description: 'Classic 2-player ping pong game',
    icon: Circle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    route: '/games/pong'
  },
  asteroids: {
    name: 'Asteroids',
    description: 'Team up to destroy asteroids!',
    icon: Rocket,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    route: '/games/asteroids'
  }
};

const GamePreview: React.FC<GamePreviewProps> = ({ gameType, compact = true }) => {
  const navigate = useNavigate();
  const game = gameData[gameType];
  
  if (!game) {
    return (
      <Card className="w-full max-w-sm border-destructive/20">
        <CardContent className="p-3 text-center">
          <p className="text-destructive text-xs">Game not found</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = game.icon;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(game.route);
  };

  return (
    <Card 
      className={`w-full max-w-sm cursor-pointer hover:bg-accent/50 transition-all duration-200 border-primary/20 group ${game.bgColor}`}
      onClick={handlePlay}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${game.bgColor}`}>
              <Icon className={`h-4 w-4 ${game.color}`} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{game.name}</h4>
              <p className="text-[10px] text-muted-foreground">{game.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Game</Badge>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Button 
            size="sm" 
            className="h-7 text-xs gap-1"
            onClick={handlePlay}
          >
            <Play className="h-3 w-3" />
            Play Now
          </Button>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
};

export default GamePreview;
