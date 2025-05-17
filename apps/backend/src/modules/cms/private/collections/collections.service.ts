import {PaginateOptions, PaginateResult} from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Collection, {CollectionDocument} from './collections.model';
import {CreateCollectionDto, UpdateCollectionDto, CollectionQueryDto} from './collections.dtos';
import Logger from '../../../../config/logger.config';
import Schema from '../../private/schema/schema.model';
import { SchemaFieldTypes } from '@halogen/common';

export class CollectionsService {
    /**
     * Create a new collection
     */
    static async createCollection(
        projectId: string,
        collectionData: CreateCollectionDto
    ): Promise<CollectionDocument> {
        try {
            const existingCollection = await Collection.findOne({
                project: projectId,
                slug: collectionData.slug
            });

            if (existingCollection) {
                throw new Error(`Collection with slug "${collectionData.slug}" already exists for this project`);
            }

            const collection = new Collection({
                ...collectionData,
                project: projectId
            });

            await collection.save();

            // Create default schema for this collection with name and slug fields
            const nameFieldId = uuidv4();
            const slugFieldId = uuidv4();

            const defaultSchema = new Schema({
                type: SchemaFieldTypes.SHORT_TEXT,
                project: projectId,
                collection: collection._id,
                fields: [
                    {
                        _id: nameFieldId,
                        label: 'Name',
                        key: 'name',
                        isDisabled: false,
                        description: 'The name of the item',
                        autoGenerateFrom: null,
                        validation: {
                            required: true,
                            unique: false,
                            minLength: 1,
                            maxLength: 100,
                            minValue: 0,
                            maxValue: 0,
                            regex: ''
                        }
                    },
                    {
                        _id: slugFieldId,
                        label: 'Slug',
                        key: 'slug',
                        isDisabled: true, // Slug field is disabled as it's auto-generated
                        description: 'The URL-friendly identifier',
                        autoGenerateFrom: 'name', // Auto-generate slug from the name field
                        validation: {
                            required: true,
                            unique: true,
                            minLength: 1,
                            maxLength: 100,
                            minValue: 0,
                            maxValue: 0,
                            regex: '^[a-z0-9\\-_]+$' // Allow lowercase letters, numbers, hyphens, underscores
                        }
                    }
                ]
            });

            await defaultSchema.save();

            return collection;
        } catch (error) {
            Logger.error(`Create collection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Get all collections for a project with pagination
     */
    static async getProjectCollections(
        projectId: string,
        queryOptions: CollectionQueryDto
    ): Promise<PaginateResult<CollectionDocument>> {
        try {
            const {page = 1, limit = 10, search, sort = '-createdAt'} = queryOptions;

            const query: any = {project: projectId};

            // Add text search if search parameter is provided
            if (search) {
                query.$text = {$search: search};
            }

            const paginateOptions: PaginateOptions = {
                page,
                limit,
                sort,
                lean: true
            };

            return await Collection.paginate(query, paginateOptions);
        } catch (error) {
            Logger.error(`Get project collections error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Get collection by ID
     */
    static async getCollectionById(id: string, projectId: string): Promise<CollectionDocument | null> {
        try {
            return await Collection.findOne({
                _id: id,
                project: projectId
            }).lean();
        } catch (error) {
            Logger.error(`Get collection by ID error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }

    /**
     * Update a collection
     */
    static async updateCollection(
        id: string,
        projectId: string,
        updateData: UpdateCollectionDto
    ): Promise<CollectionDocument | null> {
        try {
            // If slug is being updated, check for uniqueness
            if (updateData.slug) {
                const existingCollection = await Collection.findOne({
                    project: projectId,
                    slug: updateData.slug,
                    _id: {$ne: id} // Exclude the current collection from check
                });

                if (existingCollection) {
                    throw new Error(`Collection with slug "${updateData.slug}" already exists for this project`);
                }
            }

            const updatedCollection = await Collection.findOneAndUpdate(
                {_id: id, project: projectId},
                {$set: updateData},
                {new: true}
            );

            return updatedCollection;
        } catch (error) {
            Logger.error(`Update collection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
