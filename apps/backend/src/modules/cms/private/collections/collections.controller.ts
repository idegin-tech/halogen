import {Request, Response} from 'express';
import {ResponseHelper} from '../../../../lib/response.helper';
import {CollectionsService} from './collections.service';
import Logger from '../../../../config/logger.config';

export class CollectionsController {
    /**
     * Create a new collection
     */
    static async createCollection(req: Request, res: Response): Promise<void> {
        try {
            const {projectId} = req.params;

            if (!projectId) {
                ResponseHelper.error(res, 'Project ID is required', 400);
                return;
            }

            const collection = await CollectionsService.createCollection(projectId, req.body);
            ResponseHelper.success(res, collection, 'Collection created successfully');
        } catch (error) {
            Logger.error(`Collection creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to create collection',
                error instanceof Error && error.message.includes('already exists') ? 400 : 500
            );
        }
    }

    /**
     * Get all collections for a project with pagination
     */
    static async getProjectCollections(req: Request, res: Response): Promise<void> {
        try {
            const {projectId} = req.params;

            if (!projectId) {
                ResponseHelper.error(res, 'Project ID is required', 400);
                return;
            }

            const {page, limit, search, sort} = req.query;

            const collections = await CollectionsService.getProjectCollections(projectId, {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search ? String(search) : undefined,
                sort: sort ? String(sort) : '-createdAt'
            });

            ResponseHelper.success(res, collections, 'Collections retrieved successfully');
        } catch (error) {
            Logger.error(`Get collections error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to retrieve collections',
                500
            );
        }
    }

    /**
     * Update a collection
     */
    static async updateCollection(req: Request, res: Response): Promise<void> {
        try {
            const {projectId, collectionId} = req.params;

            if (!projectId) {
                ResponseHelper.error(res, 'Project ID is required', 400);
                return;
            }

            if (!collectionId) {
                ResponseHelper.error(res, 'Collection ID is required', 400);
                return;
            }

            const collection = await CollectionsService.updateCollection(collectionId, projectId, req.body);

            if (!collection) {
                ResponseHelper.error(res, 'Collection not found', 404);
                return;
            }

            ResponseHelper.success(res, collection, 'Collection updated successfully');
        } catch (error) {
            Logger.error(`Update collection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            ResponseHelper.error(
                res,
                error instanceof Error ? error.message : 'Failed to update collection',
                error instanceof Error && error.message.includes('already exists') ? 400 : 500
            );
        }
    }
}
