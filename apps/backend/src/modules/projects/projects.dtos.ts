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

export const syncProjectSchema = z.object({
  project: z.object({
    name: z.string(),
    description: z.string().optional(),
    thumbnail: z.string().optional()
  }),
  pages: z.array(z.object({
    page_id: z.string(),
    name: z.string(),
    path: z.string().optional(),
    slug: z.string().optional(),
    route: z.string().optional(),
    isStatic: z.boolean().optional()
  })).optional(),
  variables: z.array(z.object({
    variable_id: z.string(),
    name: z.string(),
    key: z.string(),
    type: z.enum(["color", "text", "size", "boolean"]),
    primaryValue: z.string(),
    secondaryValue: z.string(),
    variableSet: z.string()
  })).optional(),
  blocks: z.array(z.object({
    index: z.number(),
    page: z.string(),
    folderName: z.string(),
    subFolder: z.string(),
    value: z.any().optional(),
    instance: z.string().nullable().optional()
  })).optional()
}).strict();

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
export type ProjectsQueryDTO = z.infer<typeof projectsQuerySchema>;
export type SyncProjectDTO = z.infer<typeof syncProjectSchema>;