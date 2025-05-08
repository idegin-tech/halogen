import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail: z.string().optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').optional(),
  description: z.string().optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').optional(),
  isPublished: z.boolean().optional(),
  thumbnail: z.string().optional()
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;