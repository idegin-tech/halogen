import { z } from 'zod';
import { SchemaFieldTypes } from '@halogen/common';

export const schemaFieldValidationSchema = z.object({
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  minLength: z.number().default(0),
  maxLength: z.number().default(0),
  minValue: z.number().default(0),
  maxValue: z.number().default(0),
  regex: z.string().default('')
});

export const schemaFieldSchema = z.object({
  _id: z.string(),
  label: z.string().min(1, 'Field label is required'),
  key: z.string().min(1, 'Field key is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Key can only contain letters, numbers, and underscores'),
  isDisabled: z.boolean().default(false),
  description: z.string().nullable().optional(),
  autoGenerateFrom: z.string().nullable().optional(),
  validation: schemaFieldValidationSchema.default({
    required: false,
    unique: false,
    minLength: 0,
    maxLength: 0,
    minValue: 0,
    maxValue: 0,
    regex: ''
  })
});

export const createSchemaSchema = z.object({
  type: z.nativeEnum(SchemaFieldTypes),
  fields: z.array(schemaFieldSchema).default([])
    .refine(fields => {
      // Check for duplicate keys
      const keys = fields.map(field => field.key);
      const uniqueKeys = new Set(keys);
      return uniqueKeys.size === keys.length;
    }, {
      message: 'Field keys must be unique within a schema',
      path: ['fields']
    })
}).strict();

export const updateSchemaSchema = createSchemaSchema.partial();

export const schemaQuerySchema = z.object({
  collectionId: z.string().optional(),
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  sort: z.string().optional().transform(val => val || '-createdAt')
}).strict();

export type CreateSchemaDto = z.infer<typeof createSchemaSchema>;
export type UpdateSchemaDto = z.infer<typeof updateSchemaSchema>;
export type SchemaQueryDto = z.infer<typeof schemaQuerySchema>;
