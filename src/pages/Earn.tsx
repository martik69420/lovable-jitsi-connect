
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { Gamepad2, Trophy, Target } from 'lucide-react';

const Earn = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Games & Fun</h1>
            <p className="text-muted-foreground">Play games, have fun, and compete on the leaderboard!</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gamepad2 className="mr-2 h-5 w-5 text-primary" />
                  Play Games
                </CardTitle>
                <CardDescription>
                  Challenge yourself with fun games like Snake and Trivia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate('/games/snake')} 
                  className="w-full"
                  variant="outline"
                >
                  Play Snake
                </Button>
                <Button 
                  onClick={() => navigate('/games/trivia')} 
                  className="w-full"
                  variant="outline"
                >
                  Play Trivia
                </Button>
                <Button 
                  onClick={() => navigate('/games')} 
                  className="w-full"
                >
                  View All Games
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Compete & Achieve
                </CardTitle>
                <CardDescription>
                  Check your ranking and see how you compare with others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate('/leaderboard')} 
                  className="w-full"
                  variant="outline"
                >
                  View Leaderboard
                </Button>
                <Button 
                  onClick={() => navigate('/achievements')} 
                  className="w-full"
                  variant="outline"
                >
                  View Achievements
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earn;
