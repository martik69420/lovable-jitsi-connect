
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { 
  Terminal, 
  Gamepad, 
  Crown, 
  Trophy, 
  Users,
  Rocket,
  Circle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { bestScores, gameScores, gameState, isLoading } = useGame();

  const handleGameClick = () => {
    toast({
      title: t('games.comingSoon'),
      description: t('games.tetris')
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        {/* Header with consistent styling */}
        <div className="mb-8 bg-card p-6 rounded-lg border">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('games.hub')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('games.compete')}
          </p>
          
          <div className="flex items-center gap-3 mt-4 bg-muted/50 p-3 rounded-md w-fit">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <div className="text-foreground">
              <span className="font-medium">
                {t('games.yourProgress')}: <span className="text-primary">{gameState.progress.snake.gamesPlayed + gameState.progress.tetris.gamesPlayed}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Multiplayer Games Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Multiplayer Games</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pong Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Circle className="w-5 h-5 text-blue-500" />
                      Pong
                    </CardTitle>
                    <CardDescription>Classic 2-player ping pong game</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Users className="w-3 h-3 mr-1" />
                    2 Players
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">
                  Challenge friends in real-time multiplayer pong matches!
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/games/pong')} className="w-full">
                  Play Now
                </Button>
              </CardFooter>
            </Card>

            {/* Asteroids Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Rocket className="w-5 h-5 text-orange-500" />
                      Asteroids
                    </CardTitle>
                    <CardDescription>Cooperative space shooter</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <Users className="w-3 h-3 mr-1" />
                    Co-op
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground">
                  Team up with friends to destroy asteroids together!
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/games/asteroids')} className="w-full">
                  Play Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Single Player Games Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Gamepad className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Single Player</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Snake Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Terminal className="w-5 h-5 text-green-600" />
                      {t('games.snake')}
                    </CardTitle>
                    <CardDescription>{t('games.classicSnake')}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-medium">
                    <Crown className="w-3 h-3 mr-1" />
                    {bestScores.snake}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('games.progress')}</span>
                    <span className="font-medium">{gameState.progress.snake.gamesPlayed} {t('games.gamesPlayed')}</span>
                  </div>
                  <Progress value={Math.min(gameState.progress.snake.gamesPlayed * 10, 100)} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/games/snake')} className="w-full">
                  {t('games.playNow')}
                </Button>
              </CardFooter>
            </Card>

            {/* Tetris Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Gamepad className="w-5 h-5 text-purple-600" />
                      {t('games.tetris')}
                    </CardTitle>
                    <CardDescription>{t('games.tetrisDesc')}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-medium">
                    <Crown className="w-3 h-3 mr-1" />
                    {bestScores.tetris || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('games.progress')}</span>
                    <span className="font-medium">{gameState.progress.tetris.gamesPlayed} {t('games.gamesPlayed')}</span>
                  </div>
                  <Progress value={Math.min(gameState.progress.tetris.gamesPlayed * 10, 100)} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/games/tetris')} className="w-full">
                  {t('games.playNow')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Game Stats Section */}
        <div className="mt-8 bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-semibold">{t('games.yourStatistics')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">{t('games.snake')}</Badge>
              <p className="text-2xl font-bold">{bestScores.snake}</p>
              <p className="text-sm text-muted-foreground">{t('games.bestScore')}</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">{t('games.total')}</Badge>
              <p className="text-2xl font-bold">{gameState.progress.snake.gamesPlayed + gameState.progress.tetris.gamesPlayed}</p>
              <p className="text-sm text-muted-foreground">{t('games.gamesPlayed')}</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">{t('games.tetris')}</Badge>
              <p className="text-2xl font-bold">{bestScores.tetris || 0}</p>
              <p className="text-sm text-muted-foreground">{t('games.bestScore')}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Games;
