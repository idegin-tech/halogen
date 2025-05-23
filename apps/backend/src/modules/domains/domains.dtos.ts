import { z } from 'zod';

export const addDomainSchema = z.object({
  name: z.string()
    .min(1, 'Domain name is required')
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, 'Invalid domain name format')
    .transform(val => val.toLowerCase())
});

export const domainVerificationSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required')
});

export const sslCertificateSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required')
});

// Query validation schemas
export const domainsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['PENDING', 'PENDING_DNS', 'PROPAGATING', 'ACTIVE', 'FAILED', 'SUSPENDED']).optional(),
  isActive: z.enum(['true', 'false']).optional()
});

export type AddDomainDTO = z.infer<typeof addDomainSchema>;
export type DomainVerificationDTO = z.infer<typeof domainVerificationSchema>;
export type SSLCertificateDTO = z.infer<typeof sslCertificateSchema>;
export type DomainsQueryDTO = z.infer<typeof domainsQuerySchema>;
