
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Flag, BarChart, Settings, Zap } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { AdminFeature } from '@/types/user';

const AdminFeatures: React.FC = () => {
  const { user } = useAuth();
  
  if (!user?.isAdmin) {
    return null;
  }
  
  const adminFeatures: AdminFeature[] = [
    {
      id: 'user-management',
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      path: '/admin/users',
      icon: 'users'
    },
    {
      id: 'content-moderation',
      name: 'Content Moderation',
      description: 'Review and moderate reported content',
      path: '/reports',
      icon: 'flag'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'View platform statistics and usage data',
      path: '/admin/analytics',
      icon: 'bar-chart'
    },
    {
      id: 'settings',
      name: 'Platform Settings',
      description: 'Configure global platform settings',
      path: '/admin/settings',
      icon: 'settings'
    },
  ];
  
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'users': return <Users className="h-5 w-5" />;
      case 'flag': return <Flag className="h-5 w-5" />;
      case 'bar-chart': return <BarChart className="h-5 w-5" />;
      case 'settings': return <Settings className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold">Admin Tools</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminFeatures.map((feature) => (
          <Card key={feature.id} className="bg-muted/50 border-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  {renderIcon(feature.icon)}
                </div>
                <CardTitle className="text-base">{feature.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm" asChild className="w-full">
                <Link to={feature.path}>
                  <Zap className="h-4 w-4 mr-2" />
                  Access
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminFeatures;
