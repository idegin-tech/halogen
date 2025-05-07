import React from 'react'
import { BlocksIcon, BrushIcon, Database, FileIcon, FolderIcon, SettingsIcon } from "lucide-react"
import { ToggleButton } from '../ToggleBtn'
import PagesTopPanel from './PagesTopPanel'
import ThemeTopPanel from './ThemeTopPanel'
import BlocksTopPanel from './BlocksTopPanel'
import { useTopPanelContext } from '@/context/top-panel.context'

export default function TopPanelToggler() {
    const { state, setActiveTopPanel } = useTopPanelContext();
    const { activeTopPanel } = state;

    return (
        <>
            <div className={"w-full flex items-center justify-center gap-2"}>
                <ToggleButton
                    onClick={() => setActiveTopPanel('pages')}
                    isActive={activeTopPanel === 'pages'}
                    Icon={FileIcon} label={"Pages"}
                    placement="bottom"
                />
                <ToggleButton
                    Icon={BlocksIcon}
                    label={"Blocks"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('blocks')}
                    isActive={activeTopPanel === 'blocks'}
                />
                <ToggleButton
                    Icon={BrushIcon}
                    label={"Theme"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('theme')}
                    isActive={activeTopPanel === 'theme'}
                />
                <ToggleButton
                    Icon={FolderIcon}
                    label={"Assets"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('assets')}
                    isActive={activeTopPanel === 'assets'}
                />
                <ToggleButton
                    Icon={Database}
                    label={"Database"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('database')}
                    isActive={activeTopPanel === 'database'}
                />
                <ToggleButton
                    Icon={SettingsIcon}
                    label={"Site settings"}
                    placement="bottom"
                />
            </div>
            <PagesTopPanel
                onHide={() => setActiveTopPanel(null)}
                show={activeTopPanel === 'pages'}
            />
            <ThemeTopPanel
                onHide={() => setActiveTopPanel(null)}
                show={activeTopPanel === 'theme'}
            />
            <BlocksTopPanel
                onHide={() => setActiveTopPanel(null)}
                show={activeTopPanel === 'blocks'}
            />
        </>
    )
}
