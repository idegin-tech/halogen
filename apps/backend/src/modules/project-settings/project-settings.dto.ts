import { z } from 'zod';

/**
 * Schema for updating project fonts
 */
export const updateProjectFontsSchema = z.object({
  headingFont: z.string().optional().describe('Font for headings'),
  bodyFont: z.string().optional().describe('Font for body text')
});

/**
 * Type for updating project fonts
 */
export type UpdateProjectFontsDTO = z.infer<typeof updateProjectFontsSchema>;

export default updateProjectFontsSchema;
