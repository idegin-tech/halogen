import { ProjectProvider } from '@/context/project.context'
import { PricingModal } from '@/components/pricing/PricingModal'
import React from 'react'

type Props = {
    children: React.ReactNode
}

export default function ProjectLayout({ children }: Props) {
    return (
        <>
            <ProjectProvider>
                {children}
                <PricingModal />
            </ProjectProvider>
        </>
    )
}