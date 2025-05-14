import { z } from 'zod';

export const createProjectMetadataSchema = z.object({
  project: z.string().min(1, 'Project ID is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  favicon: z.string().optional()
});

export const updateProjectMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  favicon: z.string().optional()
});

export type CreateProjectMetadataDTO = z.infer<typeof createProjectMetadataSchema>;
export type UpdateProjectMetadataDTO = z.infer<typeof updateProjectMetadataSchema>;
