import { Request, Response } from 'express';
import { ResponseHelper } from '../../../../lib/response.helper';
import { SchemaService } from './schema.service';
import Logger from '../../../../config/logger.config';

export class SchemaController {
  /**
   * Create a new schema for a collection
   */
  static async createSchema(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, collectionId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      if (!collectionId) {
        ResponseHelper.error(res, 'Collection ID is required', 400);
        return;
      }

      const schema = await SchemaService.createSchema(projectId, collectionId, req.body);
      ResponseHelper.success(res, schema, 'Schema created successfully');
    } catch (error) {
      Logger.error(`Schema creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to create schema',
        error instanceof Error && (
          error.message.includes('not found') ? 404 :
          error.message.includes('already exists') ? 400 : 500
        )
      );
    }
  }

  /**
   * Get schema by collection ID
   */
  static async getSchemaByCollectionId(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, collectionId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      if (!collectionId) {
        ResponseHelper.error(res, 'Collection ID is required', 400);
        return;
      }

      const schema = await SchemaService.getSchemaByCollectionId(projectId, collectionId);

      if (!schema) {
        ResponseHelper.error(res, 'Schema not found for this collection', 404);
        return;
      }

      ResponseHelper.success(res, schema, 'Schema retrieved successfully');
    } catch (error) {
      Logger.error(`Get schema error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to retrieve schema',
        500
      );
    }
  }

  /**
   * Update a schema
   */
  static async updateSchema(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, schemaId } = req.params;

      if (!projectId) {
        ResponseHelper.error(res, 'Project ID is required', 400);
        return;
      }

      if (!schemaId) {
        ResponseHelper.error(res, 'Schema ID is required', 400);
        return;
      }

      const schema = await SchemaService.updateSchema(schemaId, projectId, req.body);

      if (!schema) {
        ResponseHelper.error(res, 'Schema not found', 404);
        return;
      }

      ResponseHelper.success(res, schema, 'Schema updated successfully');
    } catch (error) {
      Logger.error(`Update schema error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ResponseHelper.error(
        res,
        error instanceof Error ? error.message : 'Failed to update schema',
        500
      );
    }
  }
}
