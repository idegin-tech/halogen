import React, { useState } from 'react'
import TopPanelContainer from '../TopPanelContainer'
import { SettingsIcon, Globe, Webhook, LayoutDashboard, Users, AlertTriangle, WalletIcon, CodeIcon } from 'lucide-react'
import SettingsTopPanelProject from './SettingsTopPanelProject'
import SettingsTopPanelMetadata from './SettingsTopPanelMetadata'
import SettingsTopPanelIntegrations from './SettingsTopPanelIntegrations'
import SettingsTopPanelUsers from './SettingsTopPanelUsers'
import SettingsTopPanelBilling from './SettingsTopPanelBilling'
import SettingsTopPanelAdvanced from './SettingsTopPanelAdvanced'

type Props = {
    show: boolean;
    onHide: () => void;
}

export default function SettingsTopPanel({ show, onHide }: Props) {
    const [activeSection, setActiveSection] = useState<string>('project');    // Generate breadcrumbs based on the selected section
    const breadcrumbs = [
        { label: "Settings", href: "#" },
        {
            label: activeSection === 'project' ? 'Project Settings' :
                activeSection === 'metadata' ? 'Metadata' :
                    activeSection === 'integrations' ? 'Integrations' :
                        activeSection === 'users' ? 'Users' :
                            activeSection === 'billing' ? 'Billing' : 'Advanced'
        }
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
                },
                {
                    id: 'metadata',
                    name: 'Metadata',
                    icon: <CodeIcon />,
                },
                {
                    id: 'integrations',
                    name: 'Integrations',
                    icon: <Webhook />,
                },
                {
                    id: 'domain',
                    name: 'Domain',
                    icon: <Globe />,
                },
                {
                    id: 'users',
                    name: 'Users',
                    icon: <Users />,
                },
                {
                    id: 'billing',
                    name: 'Billing',
                    icon: <WalletIcon />,
                },
                {
                    id: 'advanced',
                    name: 'Advanced',
                    icon: <AlertTriangle />,
                },
            ]}
            activeSetId={activeSection}
            onAddSet={() => 'settings'}
            onSetActiveSet={setActiveSection}
            breadcrumbs={breadcrumbs}
        >
            <div className='flex-1 overflow-x-hidden overflow-y-auto'>                {activeSection === 'project' && <SettingsTopPanelProject />}
                {activeSection === 'metadata' && <SettingsTopPanelMetadata />}
                {activeSection === 'integrations' && <SettingsTopPanelIntegrations />}
                {activeSection === 'users' && <SettingsTopPanelUsers />}
                {activeSection === 'billing' && <SettingsTopPanelBilling />}
                {activeSection === 'advanced' && <SettingsTopPanelAdvanced />}
            </div>
        </TopPanelContainer>
    )
}