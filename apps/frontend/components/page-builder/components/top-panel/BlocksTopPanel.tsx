import React, { useState, useEffect, useMemo } from 'react'
import TopPanelContainer from './TopPanelContainer'
import { BlocksIcon, PlusCircleIcon, ImageIcon, CheckIcon, LayoutIcon, AlertCircle } from 'lucide-react'
import { useBuilderContext } from '@/context/builder.context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BlockInstance, BlockProperties } from '@halogen/common/types'
import { usePage } from '@/hooks/usePage'
import { generateId } from '@halogen/common/lib'
import { getBlockProperties } from '@repo/ui/blocks'
import blocksRegistry from '@repo/ui/blocks.json'


type BlockFolder = {
    name: string;
    subFolders: BlockSubFolder[];
}

type BlockSubFolder = {
    name: string;
    properties: BlockProperties;
    thumbnailPath?: string;
}

function UsedBlockItem({ block, instanceCount }: { block: BlockInstance, instanceCount: number }) {
    const [blockName, setBlockName] = useState(`${block.folderName}/${block.subFolder}`);
    const { selectedPageId } = usePage();
    const { state, updateBuilderState } = useBuilderContext();
    const [blockDescription, setBlockDescription] = useState('');

    useEffect(() => {
        const loadBlockInfo = async () => {
            try {
                const properties = getBlockProperties(block.folderName, block.subFolder);
                
                if (properties?.name) {
                    setBlockName(properties.name);
                }
                if (properties?.description) {
                    setBlockDescription(properties.description);
                }
            } catch (err) {
                console.error(`Error loading block info:`, err);
            }
        };
        loadBlockInfo();
    }, [block.folderName, block.subFolder]);

    let ThumbnailImage = '/placeholder.jpg';    const handleAddToPage = () => {
        if (!selectedPageId) {
            console.error("Cannot add block: No page selected");
            return;
        }

        const blockId = generateId();
        const newBlock: BlockInstance = {
            instance_id: blockId, 
            page_id: selectedPageId, 
            index: state.blocks.filter(block => block.page_id === selectedPageId).length,
            page: selectedPageId,
            folderName: block.folderName,
            subFolder: block.subFolder,
            value: null,
            instance: block.instance_id as string,
            ref: block.instance_id
        };

        updateBuilderState({
            blocks: [...state.blocks, newBlock],
            selectedBlockId: newBlock.instance_id
        });
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 select-none">
            <div className="grid grid-cols-12 h-28">
                <div className="relative col-span-6 h-28">
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                        <div className="text-4xl text-primary/30 font-bold">
                            {blockName?.charAt(0)?.toUpperCase() || 'B'}
                        </div>
                    </div>
                    {instanceCount > 0 && (
                        <div className="absolute left-2 bottom-2 px-2 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
                            {instanceCount} Duplicates
                        </div>
                    )}
                </div>
                <div className="p-2 flex-1 flex items-center justify-between col-span-6">
                    <div className='truncate'>
                        <h4 className="font-medium text-md">{blockName}</h4>
                        <p className="text-xs text-muted-foreground truncate mb-4">{blockDescription}</p>
                        {selectedPageId && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-1"
                                onClick={handleAddToPage}
                            >
                                <PlusCircleIcon className="h-4 w-4 mr-1" />
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
    const [loadError, setLoadError] = useState<string | null>(null);

    // Generate breadcrumbs based on the selected folder
    const breadcrumbs = useMemo(() => {
        const items: {label: string, href?: string}[] = [
            { label: "Blocks", href: "#" }
        ];
        
        if (selectedFolder === 'used-blocks') {
            items.push({ label: "Used Blocks" });
        } else if (selectedFolder) {
            items.push({ 
                label: selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1) 
            });
        }
        
        return items;
    }, [selectedFolder]);

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
            //@ts-ignore
            counts[block.instance_id] = 0;
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
            setLoadError(null);
            
            try {
                const folders: BlockFolder[] = [];
                
                // Use the imported blocksRegistry instead of dynamic discovery
                for (const [folderName, blockInfos] of Object.entries(blocksRegistry)) {
                    const subFolders: BlockSubFolder[] = [];
                    
                    for (const blockInfo of blockInfos) {
                        try {
                            // Get the properties for each block
                            const properties = getBlockProperties(folderName, blockInfo.name);
                            
                            if (properties) {
                                subFolders.push({
                                    name: blockInfo.name,
                                    properties,
                                    thumbnailPath: blockInfo.hasThumbnail ? 
                                        `/_next/static/media/blocks/${folderName}/${blockInfo.name}/_thumbnail.png` : 
                                        undefined
                                });
                            }
                        } catch (err) {
                            console.warn(`Failed to load properties for block: ${folderName}/${blockInfo.name}`, err);
                        }
                    }
                    
                    folders.push({
                        name: folderName,
                        subFolders
                    });
                }
                
                setBlockFolders(folders);
                
                if ((!selectedFolder || selectedFolder === 'used-blocks') && folders.length > 0) {
                    setSelectedFolder(usedBlocks.length > 0 ? 'used-blocks' : folders[0].name);
                }
            } catch (err: any) {
                console.error('Error loading block folders:', err);
                setLoadError(err?.message || 'Failed to load blocks from UI package');
            } finally {
                setIsLoadingThumbnails(false);
            }
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
    }, [selectedFolder, blockFolders]);    const handleAddBlockToPage = (folderName: string, subFolder: string, properties: BlockProperties) => {
        if (!selectedPageId) {
            console.error("Cannot add block: No page selected");
            return;
        }        
        const blockId = generateId();
        const newBlock: BlockInstance = {
            instance_id: blockId,
            page_id: selectedPageId,
            index: state.blocks.filter(block => block.page_id === selectedPageId).length,
            page: selectedPageId,
            folderName: folderName,
            subFolder: subFolder,
            value: Object.entries(properties.fields).reduce((acc, [key, field]) => {
                acc[key] = { value: field.defaultValue };
                return acc;
            }, {} as Record<string, any>),
            instance: null,
            ref: null
        };
        
        updateBuilderState({
            blocks: [...state.blocks, newBlock],
            selectedBlockId: newBlock.instance_id
        });

        onHide();
    };

    const panelSetList = useMemo(() => {
        const result = [];

        if (masterBlocks.length > 0) {
            result.push({
                id: 'used-blocks',
                name: 'Used Blocks',
                icon: <LayoutIcon />,
                isLocked: false
            });
        }

        result.push({
            id: 'block-types-header',
            name: "BLOCK TYPES", 
            isHeader: true
        });

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
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-muted-foreground border border-dashed border-muted rounded-lg">
                    <LayoutIcon className="w-10 h-10 mb-4 text-muted-foreground/70" />
                    <p className="mb-1 font-medium">No master blocks in this project</p>
                    <p className="text-sm">Create some blocks with unique values first</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-3">
                {masterBlocks.map((block) => (
                    <UsedBlockItem
                        key={block.instance_id}
                        block={block}
                        // @ts-ignore
                        instanceCount={blockInstanceCounts[block.instance_id] || 0}
                    />
                ))}
            </div>
        );
    };
    
    if (loadError) {
        return (
            <div className="h-full flex items-center justify-center text-center p-6">
                <div className="max-w-md bg-red-50 border-2 border-red-300 rounded-lg p-6 text-red-800">
                    <div className="flex items-center mb-3">
                        <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
                        <h3 className="font-semibold text-lg">Failed to Load Blocks</h3>
                    </div>
                    <p className="mb-3">Could not load blocks from UI package:</p>
                    <p className="text-sm mt-2">{loadError}</p>
                    <p className="mt-4 text-xs opacity-70">
                        Make sure the block definitions exist in the shared UI package.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <TopPanelContainer
                heading="Blocks"
                onClose={onHide}
                show={show}
                setList={panelSetList as any[]}
                activeSetId={selectedFolder}
                onAddSet={handleAddBlockFolder}
                onRemoveSet={handleRemoveBlockFolder}
                onSetActiveSet={setSelectedFolder}
                onSetChange={handleSetChange}
                breadcrumbs={breadcrumbs} // Pass the breadcrumbs to the TopPanelContainer
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
                                        <div key={i} className="bg-muted/50 rounded-lg h-64"></div>
                                    ))}
                                </div>
                            ) : currentFolderSubfolders.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {currentFolderSubfolders.map((subFolder) => {
                                        return (
                                            <div key={subFolder.name} className='rounded-xl overflow-hidden'>
                                                <Card
                                                    className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 select-none"
                                                >
                                                    <div className="relative w-full min-h-40 flex items-center overflow-hidden justify-center">
                                                        {/* Block preview - Default styled placeholder */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                                                            <div className="text-6xl text-primary/20 font-bold">
                                                                {subFolder.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        
                                                        {usedBlocks.some(ub =>
                                                            ub.folderName === selectedFolder && ub.subFolder === subFolder.name
                                                        ) && (
                                                            <Badge className='absolute right-2 top-2 text-sm z-10 bg-success hover:bg-success text-success-foreground flex items-center gap-1'>
                                                                <CheckIcon className='h-4 w-4' /> Used in project
                                                            </Badge>
                                                        )}

                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5 z-40">
                                                            <div className="space-y-3 select-none">
                                                                <div>
                                                                    <h4 className="font-medium text-lg text-white mb-1">{subFolder.properties.name}</h4>
                                                                    <p className="text-sm text-white/80">
                                                                        {subFolder.properties.description}
                                                                    </p>
                                                                </div>

                                                                {selectedPageId ? (
                                                                    <Button
                                                                        variant="default"
                                                                        className="w-full transform translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                                                                        onClick={() => handleAddBlockToPage(
                                                                            selectedFolder,
                                                                            subFolder.name,
                                                                            subFolder.properties
                                                                        )}
                                                                    >
                                                                        <PlusCircleIcon className="w-4 h-4 mr-1" />
                                                                        Add to page
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        className="w-full backdrop-blur-sm border-white/30 text-white transform translate-y-full opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                                                                    >
                                                                        Preview block
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center p-8 text-muted-foreground border border-dashed border-muted rounded-lg">
                                    <ImageIcon className="w-10 h-10 mb-4 text-muted-foreground/70" />
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