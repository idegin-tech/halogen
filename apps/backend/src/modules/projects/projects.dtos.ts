import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  thumbnail: z.string().optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').optional(),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').optional(),
  thumbnail: z.string().optional()
});

export const projectsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'subdomain']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
export type ProjectsQueryDTO = z.infer<typeof projectsQuerySchema>;