'use client';

import { ProjectProvider } from '@/context/project.context'
import { PricingModal } from '@/components/pricing/PricingModal'
import { fetchFromApi } from "@/lib/server-api";
import React from 'react'
import { ProjectData, ProjectSettings } from '@halogen/common';
import ProjectDataLoader from '@/components/ProjectDataLoader';

type Props = {
    children: React.ReactNode;
    params: Promise<{
        project_id: string;
    }>;
}

interface ProjectResponse {
    project: ProjectData;
    users: any[];
    settings: ProjectSettings | null;
    wallet: any | null;
}

export default async function Layout({ children, params }: Props) {
    const resolvedParams = await params;
    const fetchProjectData = async () => {
        return await fetchFromApi<ProjectResponse>(`/projects/${resolvedParams.project_id}`);
    };

    return (
        <div className="relative">
            <React.Suspense fallback={null}>
                <ProjectDataLoader<ProjectResponse> fetchData={fetchProjectData}>
                    {(projectData) => (
                        <ProjectProvider initialData={projectData}>
                            {children}
                            <PricingModal />
                        </ProjectProvider>
                    )}
                </ProjectDataLoader>
            </React.Suspense>
        </div>
    );
}