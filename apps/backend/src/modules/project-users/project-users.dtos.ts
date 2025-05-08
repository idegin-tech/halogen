import { z } from 'zod';
import { ProjectUserRole, ProjectUserStatus } from '@halogen/common';

export const createProjectUserSchema = z.object({
  project: z.string().min(1, 'Project ID is required'),
  user: z.string().min(1, 'User ID is required'),
  role: z.nativeEnum(ProjectUserRole),
  status: z.nativeEnum(ProjectUserStatus).default(ProjectUserStatus.ACTIVE).optional()
});

export const updateProjectUserSchema = z.object({
  role: z.nativeEnum(ProjectUserRole).optional(),
  status: z.nativeEnum(ProjectUserStatus).optional()
});

export const projectUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.enum(['role', 'status', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.union([
    z.nativeEnum(ProjectUserStatus),
    z.string().transform(val => val.split(',') as ProjectUserStatus[])
  ]).optional()
});

export type CreateProjectUserDTO = z.infer<typeof createProjectUserSchema>;
export type UpdateProjectUserDTO = z.infer<typeof updateProjectUserSchema>;
export type ProjectUsersQueryDTO = z.infer<typeof projectUsersQuerySchema>;