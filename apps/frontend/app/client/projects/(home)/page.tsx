import React from 'react';
import { fetchFromApi } from '@/lib/server-api';
import { PaginatedResponse, ProjectData } from '@halogen/common/types';
import { PageHeader } from '@/components/PageHeader';
import { ProjectSearch } from './components/ProjectSearch';
import { CreateProjectModal } from './components/CreateProjectModal';
import ClientProjects from './components/ClientProjects';
import { QueryParams } from '@/types/api.types';

interface PageProps {
  searchParams: QueryParams;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const search = searchParams.search || '';
  const page = parseInt(String(searchParams.page) || '1', 10);
  const limit = parseInt(String(searchParams.limit) || '12', 10);
  const sortBy = searchParams.sortBy === 'name' || searchParams.sortBy === 'createdAt' || searchParams.sortBy === 'updatedAt'
    ? searchParams.sortBy
    : 'updatedAt';
  const sortOrder = searchParams.sortOrder === 'asc' ? 'asc' : 'desc';

  let projectsData: PaginatedResponse<ProjectData> | null = null;
  let error: Error | null = null;

  async function getProjects(params: QueryParams = {}): Promise<PaginatedResponse<ProjectData>> {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchFromApi<PaginatedResponse<ProjectData>>(`/projects${queryString}`);
  }

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
      <PageHeader
        title="My Projects"
        description="Manage your website projects"
        rightContent={
          <>
            <ProjectSearch />
            <CreateProjectModal />
          </>
        }
      />

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
