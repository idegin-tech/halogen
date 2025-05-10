import { Request, Response } from 'express';
import { VariablesService } from './variables.service';
import { ResponseHelper } from '../../../lib/response.helper';
import { SyncVariablesDTO } from './variables.dtos';

export class VariablesController {
    static async syncVariables(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const { variables } = req.body as SyncVariablesDTO;
            
            const result = await VariablesService.syncVariables(projectId, variables || []);
            
            ResponseHelper.success(res, {
                updated: Object.keys(result.syncedVariables).length,
                deleted: result.deletedVariables.length,
                items: result.syncedVariables
            }, 'Variables synchronized successfully');
        } catch (error) {
            ResponseHelper.error(
                res, 
                error instanceof Error ? error.message : 'Failed to synchronize variables', 
                400
            );
        }
    }
}
