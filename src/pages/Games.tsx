
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import { 
  Gamepad, 
  Crown, 
  Trophy, 
  Users,
  Rocket,
  Circle,
  Share2,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ShareGameModal from '@/component/game/ShareGameModal';
import AdBanner from '@/component/ads/AdBanner';

const Games = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { bestScores, gameScores, gameState, isLoading } = useGame();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'pong' | 'asteroids' | 'geometrydash'>('pong');

  const handleShareGame = (gameType: 'pong' | 'asteroids' | 'geometrydash') => {
    setSelectedGame(gameType);
    setShareModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8 bg-card p-4 sm:p-6 rounded-lg border">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            {t('games.hub')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            {t('games.compete')}
          </p>
          
          <div className="flex items-center gap-3 mt-3 sm:mt-4 bg-muted/50 p-2.5 sm:p-3 rounded-md w-fit">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            <div className="text-foreground text-sm sm:text-base">
              <span className="font-medium">
                {t('games.yourProgress')}: <span className="text-primary">{gameState.progress.tetris.gamesPlayed}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Multiplayer Games Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold">Multiplayer Games</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Pong Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-primary/20">
              <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Circle className="w-5 h-5 text-blue-500" />
                      Pong
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Classic 2-player ping pong game</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    2P
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 p-4 pt-0 sm:p-6 sm:pt-0 sm:pb-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Challenge friends in real-time multiplayer pong matches!
                </p>
              </CardContent>
              <CardFooter className="gap-2 p-4 pt-0 sm:p-6 sm:pt-0">
                <Button onClick={() => navigate('/games/pong')} className="flex-1" size="sm">
                  Play Now
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShareGame('pong')}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Asteroids Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-primary/20">
              <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Rocket className="w-5 h-5 text-orange-500" />
                      Asteroids
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Cooperative space shooter</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Co-op
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 p-4 pt-0 sm:p-6 sm:pt-0 sm:pb-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Team up with friends to destroy asteroids together!
                </p>
              </CardContent>
              <CardFooter className="gap-2 p-4 pt-0 sm:p-6 sm:pt-0">
                <Button onClick={() => navigate('/games/asteroids')} className="flex-1" size="sm">
                  Play Now
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShareGame('asteroids')}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Geometry Dash Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200 border-primary/20">
              <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Geometry Dash
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Rhythm-based platformer</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Race
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 p-4 pt-0 sm:p-6 sm:pt-0 sm:pb-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Jump, fly and flip through levels. Create & share your own!
                </p>
              </CardContent>
              <CardFooter className="gap-2 p-4 pt-0 sm:p-6 sm:pt-0">
                <Button onClick={() => navigate('/games/geometrydash')} className="flex-1" size="sm">
                  Play Now
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShareGame('geometrydash')}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Single Player Games Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Gamepad className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg sm:text-xl font-semibold">Single Player</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Tetris Game Card */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3 p-4 sm:p-6 sm:pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Gamepad className="w-5 h-5 text-purple-600" />
                      {t('games.tetris')}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{t('games.tetrisDesc')}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-medium text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    {bestScores.tetris || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3 p-4 pt-0 sm:p-6 sm:pt-0 sm:pb-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">{t('games.progress')}</span>
                    <span className="font-medium">{gameState.progress.tetris.gamesPlayed} {t('games.gamesPlayed')}</span>
                  </div>
                  <Progress value={Math.min(gameState.progress.tetris.gamesPlayed * 10, 100)} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 sm:p-6 sm:pt-0">
                <Button onClick={() => navigate('/games/tetris')} className="w-full" size="sm">
                  {t('games.playNow')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Game Stats Section */}
        <div className="mt-6 sm:mt-8 bg-card border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg sm:text-xl font-semibold">{t('games.yourStatistics')}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2 text-xs">{t('games.total')}</Badge>
              <p className="text-xl sm:text-2xl font-bold">{gameState.progress.tetris.gamesPlayed}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('games.gamesPlayed')}</p>
            </div>
            
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg text-center">
              <Badge variant="outline" className="mb-2 text-xs">{t('games.tetris')}</Badge>
              <p className="text-xl sm:text-2xl font-bold">{bestScores.tetris || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('games.bestScore')}</p>
            </div>
          </div>
        </div>
        
        {/* Ad placement */}
        <AdBanner adSlot="2813542194" className="my-4 sm:my-6" />
      </div>
      
      <ShareGameModal 
        open={shareModalOpen} 
        onOpenChange={setShareModalOpen} 
        gameType={selectedGame as any} 
      />
    </AppLayout>
  );
};

export default Games;
