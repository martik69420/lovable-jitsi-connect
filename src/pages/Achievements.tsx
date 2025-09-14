
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const Achievements: React.FC = () => {
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="mr-2 h-6 w-6 text-amber-500" /> Achievements
            </h1>
            <p className="text-muted-foreground">Achievements system is currently being updated</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Achievement system will be available in future updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Stay tuned for badges, rewards, and more!</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Achievements;
