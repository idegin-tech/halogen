import React, { useState } from 'react'
import TopPanelContainer from '../TopPanelContainer'
import { SettingsIcon, Globe, Webhook, LayoutDashboard, Users, AlertTriangle } from 'lucide-react'
import SettingsTopPanelProject from './SettingsTopPanelProject'
import SettingsTopPanelMetadata from './SettingsTopPanelMetadata'
import SettingsTopPanelIntegrations from './SettingsTopPanelIntegrations'
import SettingsTopPanelUsers from './SettingsTopPanelUsers'
import SettingsTopPanelAdvanced from './SettingsTopPanelAdvanced'

type Props = {
  show: boolean;
  onHide: () => void;
}

export default function SettingsTopPanel({ show, onHide }: Props) {
    const [activeSection, setActiveSection] = useState<string>('project');
      // Generate breadcrumbs based on the selected section
    const breadcrumbs = [
        { label: "Settings", href: "#" },
        { label: activeSection === 'project' ? 'Project Settings' : 
                 activeSection === 'metadata' ? 'Metadata' : 
                 activeSection === 'integrations' ? 'Integrations' :
                 activeSection === 'users' ? 'Users' : 'Advanced' }
    ];

    return (
        <TopPanelContainer
            heading="Settings"
            onClose={onHide}
            show={show}
            setList={[
                {
                    id: 'project',
                    name: 'Project Settings',
                    icon: <LayoutDashboard />,
                    isLocked: false
                },
                {
                    id: 'metadata',
                    name: 'Metadata',
                    icon: <Globe />,
                    isLocked: false
                },                {
                    id: 'integrations',
                    name: 'Integrations',
                    icon: <Webhook />,
                    isLocked: false
                },
                {
                    id: 'users',
                    name: 'Users',
                    icon: <Users />,
                    isLocked: false
                },
                {
                    id: 'advanced',
                    name: 'Advanced',
                    icon: <AlertTriangle />,
                    isLocked: false
                },
            ]}
            activeSetId={activeSection}
            onAddSet={() => 'settings'}
            onSetActiveSet={setActiveSection}
            breadcrumbs={breadcrumbs}
        >            <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                {activeSection === 'project' && <SettingsTopPanelProject />}
                {activeSection === 'metadata' && <SettingsTopPanelMetadata />}
                {activeSection === 'integrations' && <SettingsTopPanelIntegrations />}
                {activeSection === 'users' && <SettingsTopPanelUsers />}
                {activeSection === 'advanced' && <SettingsTopPanelAdvanced />}
            </div>
        </TopPanelContainer>
    )
}