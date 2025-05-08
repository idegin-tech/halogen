import React from 'react';
import { getProjects, ProjectData } from '@/lib/server-api';
import { PaginatedResponse } from '@halogen/common/types';
import { ProjectsHeader } from './components/ProjectsHeader';
import ClientProjects from './components/ClientProjects';

interface PageProps {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  // Parse and validate search params
  const search = searchParams.search || '';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '12', 10);
  const sortBy = searchParams.sortBy === 'name' || searchParams.sortBy === 'createdAt' || searchParams.sortBy === 'updatedAt' 
    ? searchParams.sortBy 
    : 'updatedAt';
  const sortOrder = searchParams.sortOrder === 'asc' ? 'asc' : 'desc';
  
  // Fetch projects server-side
  let projectsData: PaginatedResponse<ProjectData> | null = null;
  let error: Error | null = null;
  
  try {
    projectsData = await getProjects({
      search,
      page,
      limit,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });
  } catch (e) {
    error = e as Error;
    console.error('Failed to fetch projects:', e);
  }
  
  return (
    <div className="space-y-8">
      {/* Use the client component for the header section with event handlers */}
      <ProjectsHeader />
      
      {/* Client-side component with server-side initial data */}
      <ClientProjects 
        initialData={projectsData} 
        initialError={error ? error.message : null} 
        searchParams={{
          search,
          page,
          limit,
          sortBy,
          sortOrder
        }}
      />
    </div>
  );
}
