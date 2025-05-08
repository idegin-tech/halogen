'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectData } from '@halogen/common/types';

interface ProjectCardProps {
  project: ProjectData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 p-0">
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={project.thumbnail || `https://source.unsplash.com/random/300x200?website,${encodeURIComponent(project.name)}`}
          alt={project.name}
          className="object-cover w-full h-full"
        />
      </div>
      <CardContent className="p-4">
        <div>
          <h3 className="text-lg font-medium">{project.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          
          </div>
        </div>
      </CardContent>
    </Card>
  );
}