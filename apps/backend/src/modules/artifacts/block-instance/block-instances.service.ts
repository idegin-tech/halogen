import mongoose from 'mongoose';
import BlockInstanceModel from './block-instances.model';
import { PagesService } from '../pages/pages.service';
import Logger from '../../../config/logger.config';

interface BlockDataWithInstanceId {
    instance_id?: string;
    page_id: string; 
    index: number;
    page: string; 
    folderName: string;
    subFolder: string;
    value?: any;
    instance?: string | null;
}

export class BlockInstancesService {
    static async syncBlockInstances(
        projectId: string, 
        blocks: any[] = []
    ): Promise<{ syncedBlocks: Record<string, any>; deletedBlocks: string[] }> {
        try {
            const syncedBlocks: Record<string, any> = {};
            const deletedBlocks: string[] = [];
            
            const allExistingBlocks = await BlockInstanceModel.find({ project: projectId });
            
            const incomingBlockIds = new Set(
                blocks.map(block => block.instance_id || '')
            );
            
            const blocksToDelete = allExistingBlocks.filter(
                block => !block.instance_id || !incomingBlockIds.has(block.instance_id)
            );
            
            for (const blockToDelete of blocksToDelete) {
                await BlockInstanceModel.findByIdAndDelete(blockToDelete._id);
                const blockId = blockToDelete.instance_id || (blockToDelete._id ? blockToDelete._id.toString() : '');
                deletedBlocks.push(blockId);
            }
            
            if (blocks.length > 0) {
                const pageIdToObjectMap = await PagesService.getPageMapByPageIds(projectId);
                
                const instanceIdToObjectMap = new Map<string, mongoose.Types.ObjectId>();
                for (const block of allExistingBlocks) {
                    if (block.instance_id && block._id) {
                        //@ts-ignore
                        instanceIdToObjectMap.set(block.instance_id, block._id);
                    }
                }
                
                for (const blockData of blocks) {
                    const typedBlockData = blockData as BlockDataWithInstanceId;
                    const { instance_id, page_id, page, index, folderName, subFolder, value, instance } = typedBlockData;
                    
                    const lookupPageId = page_id || page;
                    
                    const pageObjectId = pageIdToObjectMap.get(lookupPageId);
                    
                    const instanceObjectId = instance ? instanceIdToObjectMap.get(instance) : null;
                    
                    if (!pageObjectId) {
                        console.warn(`Page with page_id ${lookupPageId} not found for block. Creating placeholder page.`);
                        
                        const savedPage = await PagesService.createPlaceholderPage(projectId, lookupPageId);
                        //@ts-ignore
                        pageIdToObjectMap.set(lookupPageId, savedPage?._id);
                        
                        const blockFields = {
                            instance_id: instance_id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            page_id: lookupPageId, // Always preserve the frontend page_id
                            index,
                            page: savedPage._id, // Use the MongoDB reference
                            folderName,
                            subFolder,
                            value,
                            instance: instanceObjectId,
                            project: projectId
                        };
                        
                        // Continue with block creation logic
                        const existingBlock = instance_id ? 
                            await BlockInstanceModel.findOne({ instance_id }) : null;
                        
                        if (existingBlock) {
                            const updatedBlock = await BlockInstanceModel.findByIdAndUpdate(
                                existingBlock._id,
                                {
                                    ...blockFields,
                                    updatedAt: new Date()
                                },
                                { new: true }
                            );
                            if (blockFields.instance_id) {
                                syncedBlocks[blockFields.instance_id] = updatedBlock;
                            }
                        } else {
                            const newBlock = new BlockInstanceModel(blockFields);
                            const savedBlock = await newBlock.save();
                            syncedBlocks[blockFields.instance_id] = savedBlock;
                        }
                        continue;
                    }
                    
                    // If the page exists, proceed with the normal flow
                    const blockFields = {
                        instance_id: instance_id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        page_id: lookupPageId, // Always preserve the frontend page_id
                        index,
                        page: pageObjectId, // Use the MongoDB ObjectId for the page reference
                        folderName,
                        subFolder,
                        value,
                        instance: instanceObjectId,
                        project: projectId
                    };
                    
                    const existingBlock = instance_id ? 
                        await BlockInstanceModel.findOne({ instance_id }) : null;
                      if (existingBlock) {
                        const updatedBlock = await BlockInstanceModel.findByIdAndUpdate(
                            existingBlock._id,
                            {
                                ...blockFields,
                                updatedAt: new Date()
                            },
                            { new: true }
                        );
                        if (instance_id) {
                            syncedBlocks[instance_id] = updatedBlock;
                        }
                    } else {
                        const newBlock = new BlockInstanceModel({
                            ...blockFields,
                            instance_id: instance_id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                        });
                        const savedBlock = await newBlock.save();
                        //@ts-ignore
                        syncedBlocks[instance_id || blockFields.instance_id] = savedBlock;
                    }
                }
            }
            
            return {
                syncedBlocks,
                deletedBlocks
            };
        } catch (error) {
            Logger.error(`Block instances sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
