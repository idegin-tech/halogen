'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@/hooks/useApi';
import { ProjectCard } from './ProjectCard';
import { ProjectsGridSkeleton } from './ProjectCardSkeleton';
import { ProjectPagination } from './ProjectPagination';
import { CreateProjectCard } from './CreateProjectCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedResponse, ProjectData } from '@halogen/common/types';
import { QueryParams } from '@/types/api.types';
import Link from 'next/link';

interface ClientProjectsProps {
  initialData: PaginatedResponse<ProjectData> | null;
  initialError: string | null;
  searchParams: QueryParams;
}

export default function ClientProjects({ initialData, initialError, searchParams }: ClientProjectsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const queryParams = new URLSearchParams();
  if (searchParams.search) queryParams.set('search', searchParams.search);
  if (searchParams.page) queryParams.set('page', searchParams.page.toString());
  if (searchParams.limit) queryParams.set('limit', searchParams.limit.toString());
  if (searchParams.sortBy) queryParams.set('sortBy', searchParams.sortBy);
  if (searchParams.sortOrder) queryParams.set('sortOrder', searchParams.sortOrder);

  const { data: clientProjectsData, isLoading, error, refetch } = useQuery<PaginatedResponse<ProjectData>>(
    `/projects?${queryParams.toString()}`,
    undefined,
    [searchParams.search, searchParams.page, searchParams.limit, searchParams.sortBy, searchParams.sortOrder],
    { enabled: false }
  );

  const projectsData = clientProjectsData || initialData;
  const errorMessage = error || initialError;

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <ProjectsGridSkeleton />;
  }

  if (errorMessage && !projectsData) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load projects: {errorMessage}
        </AlertDescription>
      </Alert>
    );
  }

  const projects = projectsData?.docs || [];

  return (
    <div className="space-y-6">
      {projects.length === 0 && !searchParams.search ? (
        <div className="text-center py-12 space-y-4 border-2 border-dashed rounded-xl p-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <PlusCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No Projects Yet</h3>
          <p className="text-muted-foreground">Create your first project to get started with Halogen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <CreateProjectCard onClick={() => setIsCreateModalOpen(true)} />

          {projects.map((project: any) => (
            <Link
              href={`/client/projects/${project._id}/builder`}
              key={project._id}
            >
              <ProjectCard project={project} />
            </Link>
          ))}

          {projects.length === 0 && searchParams.search && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No projects found matching "{searchParams.search}"</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/client/projects')}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}

      {projectsData && projectsData.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <ProjectPagination
            currentPage={projectsData.page}
            totalPages={projectsData.totalPages}
            hasNextPage={projectsData.hasNextPage}
            hasPrevPage={projectsData.hasPrevPage}
          />
        </div>
      )}


    </div>
  );
}