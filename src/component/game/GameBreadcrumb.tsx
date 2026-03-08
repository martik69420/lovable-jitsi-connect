import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2 } from 'lucide-react';

interface GameBreadcrumbProps {
  gameName: string;
  gameIcon?: React.ReactNode;
}

const GameBreadcrumb: React.FC<GameBreadcrumbProps> = ({ gameName, gameIcon }) => {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link 
        to="/games" 
        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        <Gamepad2 className="h-4 w-4" />
        <span>Games</span>
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="flex items-center gap-1.5 text-foreground font-medium">
        {gameIcon}
        {gameName}
      </span>
    </nav>
  );
};

export default GameBreadcrumb;
