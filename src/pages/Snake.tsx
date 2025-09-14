
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SnakeGameWrapper from '@/components/game/SnakeGameWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const Snake: React.FC = () => {
  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Snake Game</CardTitle>
            <CardDescription>
              Use arrow keys to control the snake. Collect food to grow and earn points!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SnakeGameWrapper />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Snake;
