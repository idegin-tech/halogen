'use client';

import React from 'react';
import { ProjectSearch } from './ProjectSearch';
import { CreateProjectModal } from './CreateProjectModal';

export function ProjectsHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Projects</h1>
        <p className="text-muted-foreground">Manage your website projects</p>
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <ProjectSearch />
        <CreateProjectModal onProjectCreated={() => {
          // The refresh will be handled by the ClientProjects component
        }} />
      </div>
    </div>
  );
}