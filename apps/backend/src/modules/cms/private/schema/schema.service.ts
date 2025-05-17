import { PaginateOptions, PaginateResult } from 'mongoose';
import Schema, { SchemaDocument } from './schema.model';
import { CreateSchemaDto, UpdateSchemaDto, SchemaQueryDto } from './schema.dtos';
import Logger from '../../../../config/logger.config';
import { CollectionsService } from '../collections/collections.service';

export class SchemaService {
  /**
   * Check if field keys are unique within the schema
   */
  private static validateUniqueKeys(fields: any[]): boolean {
    const keys = fields.map(field => field.key);
    const uniqueKeys = new Set(keys);
    return uniqueKeys.size === keys.length;
  }

  /**
   * Create a new schema for a collection
   */
  static async createSchema(
    projectId: string,
    collectionId: string,
    schemaData: CreateSchemaDto
  ): Promise<SchemaDocument> {
    try {
      // Verify collection exists and belongs to this project
      const collection = await CollectionsService.getCollectionById(collectionId, projectId);

      if (!collection) {
        throw new Error('Collection not found or does not belong to this project');
      }

      // Check if schema already exists for this collection
      const existingSchema = await Schema.findOne({
        project: projectId,
        collection: collectionId
      });

      if (existingSchema) {
        throw new Error('Schema already exists for this collection');
      }

      // Validate that field keys are unique within the schema
      if (schemaData.fields && schemaData.fields.length > 0) {
        if (!this.validateUniqueKeys(schemaData.fields)) {
          throw new Error('Field keys must be unique within a schema');
        }
      }

      const schema = new Schema({
        ...schemaData,
        project: projectId,
        collection: collectionId
      });

      await schema.save();
      return schema;
    } catch (error) {
      Logger.error(`Create schema error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get schema for a specific collection
   */
  static async getSchemaByCollectionId(
    projectId: string,
    collectionId: string
  ): Promise<SchemaDocument | null> {
    try {
      return await Schema.findOne({
        project: projectId,
        collection: collectionId
      }).lean();
    } catch (error) {
      Logger.error(`Get schema by collection ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get schemas for a project with pagination
   */
  static async getProjectSchemas(
    projectId: string,
    queryOptions: SchemaQueryDto
  ): Promise<PaginateResult<SchemaDocument>> {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', collectionId } = queryOptions;

      const query: any = { project: projectId };

      if (collectionId) {
        query.collection = collectionId;
      }

      const paginateOptions: PaginateOptions = {
        page,
        limit,
        sort,
        lean: true
      };

      return await Schema.paginate(query, paginateOptions);
    } catch (error) {
      Logger.error(`Get project schemas error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Update a schema
   */
  static async updateSchema(
    id: string,
    projectId: string,
    updateData: UpdateSchemaDto
  ): Promise<SchemaDocument | null> {
    try {
      // Validate field keys are unique if fields are being updated
      if (updateData.fields && updateData.fields.length > 0) {
        if (!this.validateUniqueKeys(updateData.fields)) {
          throw new Error('Field keys must be unique within a schema');
        }
      }

      // When updating fields, we need to get the existing schema
      // to ensure we're not breaking any references
      if (updateData.fields) {
        const existingSchema = await Schema.findOne({
          _id: id,
          project: projectId
        });

        if (existingSchema) {
          // Check the disabled and autoGenerateFrom fields,
          // especially for the slug field which should remain disabled
          const updatedFields = updateData.fields.map(field => {
            if (field.key === 'slug') {
              // Ensure slug field stays disabled and has autoGenerateFrom set
              return {
                ...field,
                isDisabled: true,
                autoGenerateFrom: field.autoGenerateFrom || 'name'
              };
            }
            return field;
          });

          updateData.fields = updatedFields;
        }
      }

      const updatedSchema = await Schema.findOneAndUpdate(
        { _id: id, project: projectId },
        { $set: updateData },
        { new: true }
      );

      return updatedSchema;
    } catch (error) {
      Logger.error(`Update schema error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

