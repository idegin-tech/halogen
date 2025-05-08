'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectData } from '@/lib/server-api';

interface ProjectCardProps {
  project: ProjectData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  
  const handleEditClick = () => {
    router.push(`/client/projects/${project._id}/builder`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={project.thumbnail || `https://source.unsplash.com/random/300x200?website,${encodeURIComponent(project.name)}`}
          alt={project.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{project.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
            <Button size="sm" onClick={handleEditClick}>
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}