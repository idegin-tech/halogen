import { ProjectProvider } from '@/context/project.context'
import { PricingModal } from '@/components/pricing/PricingModal'
import { fetchFromApi } from "@/lib/server-api";
import React from 'react'
import { ProjectData, ProjectSettings } from '@halogen/common';

type Props = {
    children: React.ReactNode
    params: {
        project_id: string
    }
}

interface ProjectResponse {
    project: ProjectData;
    users: any[];
    settings: ProjectSettings | null;
    wallet: any | null;
}

export default async function ProjectLayout({ children, params }: Props) {
    const projectData = await fetchFromApi<ProjectResponse>(`/projects/${params.project_id}`);

    return (
        <>
            <ProjectProvider initialData={projectData}>
                {children}
                <PricingModal />
            </ProjectProvider>
        </>
    )
}