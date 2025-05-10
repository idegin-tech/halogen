import { z } from 'zod';

export const syncPagesSchema = z.object({
  pages: z.array(z.object({
    page_id: z.string(),
    name: z.string(),
    path: z.string().optional(),
    slug: z.string().optional(),
    route: z.string().optional(),
    isStatic: z.boolean().optional()
  })).optional()
});

export type SyncPagesDTO = z.infer<typeof syncPagesSchema>;
