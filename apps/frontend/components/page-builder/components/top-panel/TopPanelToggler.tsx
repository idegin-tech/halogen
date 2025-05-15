import React from 'react'
import { BlocksIcon, BrushIcon, Database, FileIcon, FolderIcon, Puzzle, SettingsIcon } from "lucide-react"
import { ToggleButton } from '../ToggleBtn'
import PagesTopPanel from './PagesTopPanel'
import ThemeTopPanel from './ThemeTopPanel/ThemeTopPanel'
import BlocksTopPanel from './BlocksTopPanel'
import FilesTopPanel from './FilesTopPanel'
import SettingsTopPanel from './SettingsTopPanel/SettingsTopPanel'
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
                    label={"Files"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('files')}
                    isActive={activeTopPanel === 'files'}
                />
                <ToggleButton
                    Icon={Database}
                    label={"CMS"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('cms')}
                    isActive={activeTopPanel === 'cms'}
                />
                <ToggleButton
                    Icon={SettingsIcon}
                    label={"Site settings"}
                    placement="bottom"
                    onClick={() => setActiveTopPanel('settings')}
                    isActive={activeTopPanel === 'settings'}
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
            />            <FilesTopPanel
                onHide={() => setActiveTopPanel(null)}
                show={activeTopPanel === 'files'}
            />
            <SettingsTopPanel
                onHide={() => setActiveTopPanel(null)}
                show={activeTopPanel === 'settings'}
            />
        </>
    )
}
