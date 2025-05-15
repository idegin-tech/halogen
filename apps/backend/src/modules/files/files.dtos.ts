import { z } from 'zod';
import { 
  MAX_FILES_PER_UPLOAD
} from '@halogen/common';

export const fileQuerySchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  sort: z.string().optional()
});

export const fileDeleteSchema = z.object({
  fileIds: z.array(z.string()).min(1).max(MAX_FILES_PER_UPLOAD)
});

export type FileQuery = z.infer<typeof fileQuerySchema>;
export type FileDelete = z.infer<typeof fileDeleteSchema>;
