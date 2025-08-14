import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Construction Tracker</h1>
        <p className="text-muted-foreground mb-8">Manage your construction projects efficiently</p>
        <Button onClick={() => navigate('/projects')}>
          Go to Projects
        </Button>
      </div>
    </div>
  );
};

export default Index;
