
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TicTacToe: React.FC = () => {
  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tic Tac Toe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="grid grid-cols-3 gap-2">
                {Array(9).fill(null).map((_, index) => (
                  <div 
                    key={index} 
                    className="w-20 h-20 flex items-center justify-center bg-muted border border-border text-3xl font-bold cursor-pointer hover:bg-accent"
                  />
                ))}
              </div>
              <p className="text-lg font-medium">Coming Soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TicTacToe;
