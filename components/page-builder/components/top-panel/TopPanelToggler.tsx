import React from 'react'
import { BlocksIcon, BrushIcon, FileIcon, SettingsIcon } from "lucide-react";
import { ToggleButton } from '../ToggleBtn';
import PagesTopPanel from './PagesTopPanel';
import ThemeTopPanel from './ThemeTopPanel';

export default function TopPanelToggler() {
    const [activePanel, setActivePanel] = React.useState<string | null>(null);
    return (
        <>
            <div className={"w-full flex items-center justify-center"}>
                <ToggleButton
                    onClick={() => setActivePanel(activePanel == 'pages' ? null : 'pages')}
                    isActive={activePanel?.includes('pages')}
                    Icon={FileIcon} label={"Pages"}
                    placement="bottom"
                />
                <ToggleButton
                    Icon={BlocksIcon}
                    label={"Blocks"}
                    placement="bottom"
                    onClick={() => setActivePanel(activePanel == 'blocks' ? null : 'blocks')}
                    isActive={activePanel?.includes('blocks')}
                />
                <ToggleButton 
                    Icon={BrushIcon} 
                    label={"Theme"} 
                    placement="bottom"
                    onClick={() => setActivePanel(activePanel == 'theme' ? null : 'theme')}
                    isActive={activePanel?.includes('theme')}
                />
                <ToggleButton Icon={SettingsIcon} label={"Site settings"} placement="bottom" />
            </div>
            <PagesTopPanel onHide={() => setActivePanel(null)} show={activePanel === 'pages'} />
            <ThemeTopPanel onHide={() => setActivePanel(null)} show={activePanel === 'theme'} />
        </>
    )
}
