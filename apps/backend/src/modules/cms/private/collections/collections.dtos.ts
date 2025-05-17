import {z} from 'zod';

export const createCollectionSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
    slug: z.string()
        .min(1, 'Slug is required')
        .max(100, 'Slug cannot exceed 100 characters')
        .regex(/^[a-z0-9\-_]+$/, 'Slug can only contain lowercase letters, numbers, hyphens, and underscores'),
    description: z.string().nullable().optional()
}).strict();

export const updateCollectionSchema = createCollectionSchema.partial();

export const collectionQuerySchema = z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
    sort: z.string().optional().transform(val => val || '-createdAt')
}).strict();

export type CreateCollectionDto = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionDto = z.infer<typeof updateCollectionSchema>;
export type CollectionQueryDto = z.infer<typeof collectionQuerySchema>;
