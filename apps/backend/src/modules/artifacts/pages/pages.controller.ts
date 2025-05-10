import { Request, Response } from 'express';
import { PagesService } from './pages.service';
import { ResponseHelper } from '../../../lib/response.helper';
import { SyncPagesDTO } from './pages.dtos';

export class PagesController {
    static async syncPages(req: Request, res: Response): Promise<void> {
        try {
            const { projectId } = req.params;
            const { pages } = req.body as SyncPagesDTO;
            
            const result = await PagesService.syncPages(projectId, pages || []);
            
            ResponseHelper.success(res, {
                updated: Object.keys(result.syncedPages).length,
                deleted: result.deletedPages.length,
                items: result.syncedPages
            }, 'Pages synchronized successfully');
        } catch (error) {
            ResponseHelper.error(
                res, 
                error instanceof Error ? error.message : 'Failed to synchronize pages', 
                400
            );
        }
    }
}
