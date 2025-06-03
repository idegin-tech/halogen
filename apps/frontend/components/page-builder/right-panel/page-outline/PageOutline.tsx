'use client';

import React, { useState, useEffect } from 'react';
import { useBuilderContext } from '@/context/builder.context';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableBlockItem } from './SortableBlockItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, ChevronDown, ChevronRight, RefreshCw, MoveVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PropertyFormContainer from '../block-config-form/PropertyFormContainer';
import { BlockInstance } from '@halogen/common/types';
import { getBlockProperties } from '@repo/ui/blocks';
import { usePage } from '@/hooks/usePage';

export default function PageOutline() {
    const { state, updateBuilderState } = useBuilderContext();
    const [blocks, setBlocks] = useState<BlockInstance[]>([]);
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
    const [blockNames, setBlockNames] = useState<Record<string, string>>({});

    // Initialize DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Minimum drag distance required before activation
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Filter blocks for the selected page
    useEffect(() => {
        if (!state.selectedPageId) {
            setBlocks([]);
            return;
        }

        const pageBlocks = state.blocks
            .filter(block => block.page_id === state.selectedPageId)
            .sort((a, b) => a.index - b.index);

        setBlocks(pageBlocks);
    }, [state.blocks, state.selectedPageId]);

    // Load block names
    useEffect(() => {
        const loadBlockNames = async () => {
            const names: Record<string, string> = {};

            for (const block of blocks) {
                try {
                    const properties = await getBlockProperties(block.folderName, block.subFolder);
                    if (properties?.name) {
                        names[block.instance_id!] = properties.name;
                    } else {
                        names[block.instance_id!] = `${block.folderName}/${block.subFolder}`;
                    }
                } catch (err) {
                    names[block.instance_id!] = `${block.folderName}/${block.subFolder}`;
                }
            }

            setBlockNames(names);
        };

        loadBlockNames();
    }, [blocks]);

    // Toggle the expanded state of a block
    const toggleExpanded = (blockId: string) => {
        setExpandedBlocks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(blockId)) {
                newSet.delete(blockId);
            } else {
                newSet.add(blockId);
            }
            return newSet;
        });
    };

    // Handle drag end event - update block order
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex(block => block.instance_id === active.id);
            const newIndex = blocks.findIndex(block => block.instance_id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Reorder blocks locally
                const newBlocks = arrayMove(blocks, oldIndex, newIndex);

                // Update indexes
                const updatedBlocks = newBlocks.map((block, index) => ({
                    ...block,
                    index
                }));

                // Update the builder context with the new order
                updateBuilderState({
                    blocks: state.blocks.map(block => {
                        const updatedBlock = updatedBlocks.find(b => b.instance_id === block.instance_id);
                        return updatedBlock || block;
                    })
                });
            }
        }
    };

    // Select a block
    const handleSelectBlock = (blockId: string) => {
        updateBuilderState({ selectedBlockId: blockId });
    };

    if (!state.selectedPageId) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                    <Layers className="h-12 w-12 mb-4 opacity-50" />
                    <p className="mb-2 text-lg font-medium">No Page Selected</p>
                    <p className="text-sm">Select a page to view and manage its blocks</p>
                </div>
            </>
        );
    }

    if (blocks.length === 0) {
        return (
            <>
                <div className="flex mt-40 flex-col items-center justify-center h-full p-6 text-center border border-dashed border-muted rounded-lg">
                    <Layers className="h-12 w-12 mb-4 text-muted-foreground/70" />
                    <p className="mb-2 text-lg font-medium">No Blocks On This Page</p>
                    <p className="text-sm text-muted-foreground">Add some blocks to this page to see them here</p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="space-y-1 pr-4 py-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={blocks.map(block => block.instance_id!)}
                        strategy={verticalListSortingStrategy}
                    >
                        {blocks.map((block, index) => (
                            <SortableBlockItem
                                key={block.instance_id}
                                id={block.instance_id!}
                                index={index}
                                name={blockNames[block.instance_id!] || `${block.folderName}/${block.subFolder}`}
                                folderName={block.folderName}
                                subFolder={block.subFolder}
                                isSelected={state.selectedBlockId === block.instance_id}
                                isExpanded={expandedBlocks.has(block.instance_id!)}
                                onToggleExpand={() => toggleExpanded(block.instance_id!)}
                                onSelect={() => handleSelectBlock(block.instance_id!)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </>
    );
}
