import { z } from 'zod';

export const syncBlocksSchema = z.object({
  blocks: z.array(z.object({
    instance_id: z.string().optional(),
    page_id: z.string(),
    index: z.number(),
    page: z.string(),
    folderName: z.string(),
    subFolder: z.string(),
    value: z.any().optional(),
    instance: z.string().nullable().optional(),
    ref: z.string().nullable().optional() // Add ref field to support frontend instance references
  })).optional()
});

export type SyncBlocksDTO = z.infer<typeof syncBlocksSchema>;
