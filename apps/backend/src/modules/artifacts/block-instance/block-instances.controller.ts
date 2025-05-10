import { Request, Response } from 'express';
import { BlockInstancesService } from './block-instances.service';
import { ResponseHelper } from '../../../lib/response.helper';
import { SyncBlocksDTO } from './block-instances.dtos';

export class BlockInstancesController {
    static async syncBlockInstances(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const { blocks } = req.body as SyncBlocksDTO;
            
            const result = await BlockInstancesService.syncBlockInstances(projectId, blocks || []);
            
            ResponseHelper.success(res, {
                updated: Object.keys(result.syncedBlocks).length,
                deleted: result.deletedBlocks.length,
                items: result.syncedBlocks
            }, 'Block instances synchronized successfully');
        } catch (error) {
            ResponseHelper.error(
                res, 
                error instanceof Error ? error.message : 'Failed to synchronize block instances', 
                400
            );
        }
    }
}
