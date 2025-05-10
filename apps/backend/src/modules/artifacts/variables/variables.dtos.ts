import { z } from 'zod';

export const syncVariablesSchema = z.object({
  variables: z.array(z.object({
    variable_id: z.string(),
    name: z.string(),
    key: z.string(),
    type: z.enum(["color", "text", "size", "boolean"]),
    primaryValue: z.string(),
    secondaryValue: z.string(),
    variableSet: z.string()
  })).optional()
});

export type SyncVariablesDTO = z.infer<typeof syncVariablesSchema>;
