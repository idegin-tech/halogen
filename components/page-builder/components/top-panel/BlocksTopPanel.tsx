import React, { useState, useEffect, useMemo } from 'react'
import TopPanelContainer from './TopPanelContainer'
import { BlocksIcon, PlusCircleIcon, ImageIcon, CheckIcon, LayoutIcon } from 'lucide-react'
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

function UsedBlockItem({ block, instanceCount }: { block: any, instanceCount: number }) {
    const [blockName, setBlockName] = useState(`${block.folderName}/${block.subFolder}`);
    const { selectedPageId } = usePage();
    const { state, updateBuilderState } = useBuilderContext();
    const [blockDescription, setBlockDescription] = useState('');
    
    useEffect(() => {
        const loadBlockInfo = async () => {
            try {
                const module = await import(`@/blocks/${block.folderName}/${block.subFolder}/_block`);
                if (module.properties?.name) {
                    setBlockName(module.properties.name);
                }
                if (module.properties?.description) {
                    setBlockDescription(module.properties.description);
                }
            } catch (err) {
                console.error(`Error loading block info:`, err);
            }
        };
        loadBlockInfo();
    }, [block.folderName, block.subFolder]);

    let ThumbnailImage;
    try {
        ThumbnailImage = require(`../../../../blocks/${block.folderName}/${block.subFolder}/_thumbnail.png`).default;
    } catch (err) {
        ThumbnailImage = '/placeholder.jpg';
    }

    const handleAddToPage = () => {
        if (!selectedPageId) {
            console.error("Cannot add block: No page selected");
            return;
        }

        const newBlock = {
            id: uuidv4(),
            index: state.blocks.length,
            page: selectedPageId,
            folderName: block.folderName,
            subFolder: block.subFolder,
            value: null,  
            instance: block.id 
        };

        updateBuilderState({
            blocks: [...state.blocks, newBlock],
            selectedBlockId: newBlock.id
        });
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-divider bg-card transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 select-none">
            <div className="grid grid-cols-12 h-28">
                <div className="relative col-span-6 h-28">
                    <Image
                        src={ThumbnailImage}
                        alt={blockName}
                        fill
                        className="object-cover"
                    />
                    {instanceCount > 0 && (
                        <div className="absolute left-2 bottom-2 px-2 py-1 bg-primary text-white rounded-lg text-xs font-medium">
                            {instanceCount} Duplicates
                        </div>
                    )}
                </div>
                <div className="p-2 flex-1 flex items-center justify-between col-span-6">
                    <div className='truncate'>
                        <h4 className="font-medium text-md">{blockName}</h4>
                        <p className="text-xs text-default-500 truncate mb-4">{blockDescription}</p>
                        {selectedPageId && (
                            <Button
                                size="sm"
                                color="default"
                                variant="flat"
                                startContent={<PlusCircleIcon className="min-w-4 min-h-4 w-4" />}
                                onClick={handleAddToPage}
                            >
                                Add To Page
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BlocksTopPanel({ show, onHide }: { show: boolean, onHide: () => void }) {
    const { state, updateBuilderState } = useBuilderContext();
    const { selectedPageId } = usePage();

    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [blockFolders, setBlockFolders] = useState<BlockFolder[]>([]);
    const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(true);

    const usedBlocks = useMemo(() => {
        return [...state.blocks].sort((a, b) => {
            if (a.page !== b.page) {
                return a.page < b.page ? -1 : 1;
            }
            return a.index - b.index;
        });
    }, [state.blocks]);

    const masterBlocks = useMemo(() => {
        return state.blocks.filter(block => 
            block.instance === null && 
            block.value !== null
        ).sort((a, b) => {
            if (a.page !== b.page) {
                return a.page < b.page ? -1 : 1;
            }
            return a.index - b.index;
        });
    }, [state.blocks]);
    
    const blockInstanceCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        
        masterBlocks.forEach(block => {
            counts[block.id] = 0;
        });
        
        state.blocks.forEach(block => {
            if (block.instance !== null && block.value === null && counts[block.instance] !== undefined) {
                counts[block.instance]++;
            }
        });
        
        return counts;
    }, [state.blocks, masterBlocks]);

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

            if ((!selectedFolder || selectedFolder === 'used-blocks') && folders.length > 0) {
                setSelectedFolder(usedBlocks.length > 0 ? 'used-blocks' : folders[0].name);
            }

            setIsLoadingThumbnails(false);
        };

        loadBlockFolders();
    }, [selectedFolder, usedBlocks.length]);

    const handleAddBlockFolder = (name?: string) => {
        const folderName = name || "New Block Type";
        console.log(`Create new block folder: ${folderName}`);
        return folderName.toLowerCase().replace(/\s+/g, '-');
    };

    const handleRemoveBlockFolder = (id: string) => {
        console.log(`Remove block folder: ${id}`);
        if (selectedFolder === id) {
            setSelectedFolder(null);
        }
    };

    const handleSetChange = (data: any) => {
        console.log('Block folder change:', data);
    };

    const currentFolderSubfolders = useMemo(() => {
        if (!selectedFolder || selectedFolder === 'used-blocks') return [];
        const folder = blockFolders.find(f => f.name === selectedFolder);
        return folder ? folder.subFolders : [];
    }, [selectedFolder, blockFolders]);

    const handleAddBlockToPage = (folderName: string, subFolder: string, properties: BlockProperties) => {
        if (!selectedPageId) {
            console.error("Cannot add block: No page selected");
            return;
        }

        const newBlock = {
            id: uuidv4(),
            index: state.blocks.length,
            page: selectedPageId,
            folderName: folderName,
            subFolder: subFolder,
            value: Object.entries(properties.fields).reduce((acc, [key, field]) => {
                acc[key] = { value: field.defaultValue };
                return acc;
            }, {} as Record<string, any>),
            instance: null 
        };

        updateBuilderState({
            blocks: [...state.blocks, newBlock],
            selectedBlockId: newBlock.id
        });

        onHide();
    };

    const panelSetList = useMemo(() => {
        const result = [];

        if (masterBlocks.length > 0) {
            result.push({
                id: 'used-blocks',
                name: 'Master Blocks',
                icon: <LayoutIcon />,
                isLocked: false
            });
        }
        
        result.push("BLOCK TYPES");
        
        result.push(...blockFolders.map((folder) => ({
            id: folder.name,
            name: folder.name.charAt(0).toUpperCase() + folder.name.slice(1),
            icon: <BlocksIcon />,
            isLocked: false,
        })));
        
        return result;
    }, [blockFolders, masterBlocks]);

    const renderUsedBlocks = () => {
        if (masterBlocks.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-muted-foreground border border-dashed border-default-300 rounded-lg">
                    <LayoutIcon className="w-10 h-10 mb-4 text-default-400" />
                    <p className="mb-1 font-medium">No master blocks in this project</p>
                    <p className="text-sm">Create some blocks with unique values first</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-3">
                {masterBlocks.map((block) => (
                    <UsedBlockItem 
                        key={block.id} 
                        block={block} 
                        instanceCount={blockInstanceCounts[block.id] || 0} 
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <TopPanelContainer
                heading="Blocks"
                onClose={onHide}
                show={show}
                setList={panelSetList}
                activeSetId={selectedFolder}
                onAddSet={handleAddBlockFolder}
                onRemoveSet={handleRemoveBlockFolder}
                onSetActiveSet={setSelectedFolder}
                onSetChange={handleSetChange}
                subPageHeading={
                    selectedFolder === 'used-blocks' 
                        ? "Master Blocks" 
                        : selectedFolder 
                            ? `${selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} Blocks` 
                            : "Select a block type"
                }
            >
                <div className='flex-1 overflow-x-hidden overflow-y-auto'>
                    {selectedFolder === 'used-blocks' ? (
                        <div className="p-2">
                            {renderUsedBlocks()}
                        </div>
                    ) : selectedFolder ? (
                        <div className="p-2">
                           

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
                                                    {usedBlocks.some(ub => 
                                                        ub.folderName === selectedFolder && ub.subFolder === subFolder.name
                                                    ) && (
                                                        <div className='px-2 bg-green-500 text-white rounded-lg flex items-center gap-1 absolute right-2 top-2 text-sm z-10'>
                                                            <CheckIcon className='h-4 w-4' /> Used in project
                                                        </div>
                                                    )}

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