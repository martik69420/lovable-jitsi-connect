
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';

const TrendingTopics: React.FC = () => {
  // This would typically come from an API or context
  const trendingTopics = [
    { id: 1, name: 'Campus Events', count: 243 },
    { id: 2, name: 'Study Groups', count: 187 },
    { id: 3, name: 'Tech Internships', count: 165 },
    { id: 4, name: 'Job Opportunities', count: 132 },
    { id: 5, name: 'Dorm Life', count: 98 },
  ];
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Trending Now</h2>
      </div>
      
      <div className="space-y-3">
        {trendingTopics.map((topic) => (
          <div 
            key={topic.id}
            className="flex items-center justify-between p-3 bg-accent/30 rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{topic.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">{topic.count} posts</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <a 
          href="#" 
          className="text-sm text-primary hover:underline"
        >
          See all trending topics
        </a>
      </div>
    </div>
  );
};

export default TrendingTopics;
