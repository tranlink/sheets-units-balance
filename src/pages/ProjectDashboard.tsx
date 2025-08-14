import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ConstructionTracker from '@/components/ConstructionTracker';

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  if (!projectId) {
    navigate('/projects');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
      <ConstructionTracker projectId={projectId} />
    </div>
  );
};

export default ProjectDashboard;