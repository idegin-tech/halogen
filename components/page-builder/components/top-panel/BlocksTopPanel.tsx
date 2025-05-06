import React, { useState, useEffect, useMemo } from 'react'
import TopPanelContainer from './TopPanelContainer'
import { BlocksIcon, Layers, PlusCircleIcon, ImageIcon, CheckIcon } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { Button, Card, Badge } from '@heroui/react'
import { BlockProperties } from '@/types/block.types'
import Image from 'next/image'
import { usePage } from '@/hooks/usePage'
import { v4 as uuidv4 } from 'uuid'

type BlockFolder = {
    name: string;
    subFolders: BlockSubFolder[];
}

type BlockSubFolder = {
    name: string;
    properties: BlockProperties;
    thumbnailPath?: string;
}

export default function BlocksTopPanel({ show, onHide }: { show: boolean, onHide: () => void }) {
    const { state, updateBuilderState } = useBuilderContext();
    const { selectedPageId } = usePage();

    // State for tracking the selected block type folder and subfolder
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [blockFolders, setBlockFolders] = useState<BlockFolder[]>([]);
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(true);

    // Simulate loading block folders (in a real app, this would be fetched from an API or filesystem)
    useEffect(() => {
        const loadBlockFolders = async () => {
            setIsLoadingThumbnails(true);
            const folders: BlockFolder[] = [
                {
                    name: "hero",
                    subFolders: []
                },
                {
                    name: "testimonials",
                    subFolders: []
                }
            ];

            // For each folder, load the subfolders and their properties
            for (const folder of folders) {
                if (folder.name === "hero") {
                    try {
                        const subFolderName = "basic_saas_hero";
                        const module = await import(`@/blocks/${folder.name}/${subFolderName}/_block`);

                        folder.subFolders.push({
                            name: subFolderName,
                            properties: module.properties,
                            thumbnailPath: `/_next/static/media/blocks.${folder.name}.${subFolderName}.thumbnail.png`
                        });
                    } catch (err) {
                        console.error(`Error loading hero block properties:`, err);
                    }
                } else if (folder.name === "testimonials") {
                    try {
                        const subFolderName = "simple_testimonial";
                        const module = await import(`@/blocks/${folder.name}/${subFolderName}/_block`);

                        folder.subFolders.push({
                            name: subFolderName,
                            properties: module.properties,
                            thumbnailPath: `/_next/static/media/blocks.${folder.name}.${subFolderName}.thumbnail.png`
                        });
                    } catch (err) {
                        console.error(`Error loading testimonial block properties:`, err);
                    }
                }
            }

            setBlockFolders(folders);

            // Set default selected folder if none is selected
            if (!selectedFolder && folders.length > 0) {
                setSelectedFolder(folders[0].name);
            }

            setIsLoadingThumbnails(false);
        };

        loadBlockFolders();
    }, [selectedFolder]);

    const handleAddBlockFolder = (name?: string) => {
        // In a real app, this would create a new block folder
        // For now, just log the request
        const folderName = name || "New Block Type";
        console.log(`Create new block folder: ${folderName}`);
        return folderName.toLowerCase().replace(/\s+/g, '-');
    };

    const handleRemoveBlockFolder = (id: string) => {
        // In a real app, this would remove a block folder
        console.log(`Remove block folder: ${id}`);
        if (selectedFolder === id) {
            setSelectedFolder(null);
        }
    };

    const handleSetChange = (data: any) => {
        console.log('Block folder change:', data);
    };

    // Get the current folder's subfolders
    const currentFolderSubfolders = useMemo(() => {
        if (!selectedFolder) return [];
        const folder = blockFolders.find(f => f.name === selectedFolder);
        return folder ? folder.subFolders : [];
    }, [selectedFolder, blockFolders]);

    // Handle adding a block to the page
    const handleAddBlockToPage = (folderName: string, subFolder: string, properties: BlockProperties) => {
        if (!selectedPageId) {
            console.error("Cannot add block: No page selected");
            return;
        }

        // Create a new block instance
        const newBlock = {
            id: uuidv4(),
            index: state.blocks.length,
            page: selectedPageId,
            folderName: folderName,
            subFolder: subFolder,
            value: Object.entries(properties.fields).reduce((acc, [key, field]) => {
                acc[key] = { value: field.defaultValue };
                return acc;
            }, {} as Record<string, any>)
        };

        // Add the new block to the state
        updateBuilderState({
            blocks: [...state.blocks, newBlock],
            selectedBlockId: newBlock.id
        });

        // Close the panel after adding
        onHide();
    };

    return (
        <>
            <TopPanelContainer
                heading="Blocks"
                onClose={onHide}
                show={show}
                setList={blockFolders.map((folder) => ({
                    id: folder.name,
                    name: folder.name.charAt(0).toUpperCase() + folder.name.slice(1),
                    icon: <BlocksIcon />,
                    isLocked: false,
                }))}
                activeSetId={selectedFolder}
                onAddSet={handleAddBlockFolder}
                onRemoveSet={handleRemoveBlockFolder}
                onSetActiveSet={setSelectedFolder}
                onSetChange={handleSetChange}
            >
                <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                    {selectedFolder ? (
                        <div className="p-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium">
                                    {selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} Blocks
                                </h3>
                                {selectedPageId && (
                                    <Badge color="primary" variant="flat" className="px-2 py-1">
                                        Page selected
                                    </Badge>
                                )}
                            </div>

                            {isLoadingThumbnails ? (
                                <div className="grid grid-cols-1 gap-6 animate-pulse">
                                    {[1, 2].map(i => (
                                        <div key={i} className="bg-default-100 rounded-lg h-64"></div>
                                    ))}
                                </div>
                            ) : currentFolderSubfolders.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {currentFolderSubfolders.map((subFolder) => {
                                        let ThumbnailImage;
                                        try {
                                            ThumbnailImage = require(`../../../../blocks/${selectedFolder}/${subFolder.name}/_thumbnail.png`).default;
                                        } catch (err) {
                                            ThumbnailImage = '/placeholder.jpg';
                                        }

                                        return (
                                            <div
                                                key={subFolder.name}
                                                className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 select-none"
                                            >
                                                <div className="relative w-full h-56 overflow-hidden">
                                                    <Image
                                                        src={ThumbnailImage}
                                                        alt={subFolder.properties.name}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={() => {
                                                            console.log("Error loading thumbnail");
                                                        }}
                                                    />
                                                    <div className='px-2 bg-green-400 text-white rounded-lg flex items-center gap-1 absolute right-2 top-2 text-sm z-10'>
                                                        <CheckIcon className='h-4 w-4' /> Used on this page
                                                    </div>

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                                                        <div className="space-y-3 select-none">
                                                            <div>
                                                                <h4 className="font-medium text-lg text-white mb-1">{subFolder.properties.name}</h4>
                                                                <p className="text-sm text-white/80">
                                                                    {subFolder.properties.description}
                                                                </p>
                                                            </div>

                                                            {selectedPageId ? (
                                                                <Button
                                                                    size="md"
                                                                    color="primary"
                                                                    variant="solid"
                                                                    className="w-full transform translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                                                                    startContent={<PlusCircleIcon className="w-4 h-4" />}
                                                                    onClick={() => handleAddBlockToPage(
                                                                        selectedFolder,
                                                                        subFolder.name,
                                                                        subFolder.properties
                                                                    )}
                                                                >
                                                                    Add to page
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="md"
                                                                    variant="bordered"
                                                                    color="default"
                                                                    className="w-full backdrop-blur-sm border-white/30 text-white transform translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                                                                >
                                                                    Preview block
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-muted-foreground border border-dashed border-default-300 rounded-lg">
                                    <ImageIcon className="w-10 h-10 mb-4 text-default-400" />
                                    <p className="mb-1 font-medium">No blocks available</p>
                                    <p className="text-sm">No blocks found in this category</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <BlocksIcon className="h-12 w-12 mb-4 opacity-50" />
                            <p className="mb-2 text-lg font-medium">Select a block category</p>
                            <p className="text-sm">Choose a block type from the sidebar to view available blocks</p>
                        </div>
                    )}
                </div>
            </TopPanelContainer>
        </>
    )
}