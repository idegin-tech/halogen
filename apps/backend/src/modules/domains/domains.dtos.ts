import { z } from 'zod';

export const domainCheckSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required')
});

export const sslCertificateSchema = z.object({
  domainId: z.string().min(1, 'Domain ID is required')
});

export const domainsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.enum(['PENDING', 'PENDING_DNS', 'PROPAGATING', 'ACTIVE', 'FAILED', 'SUSPENDED']).optional(),
  isActive: z.enum(['true', 'false']).optional()
});

export type DomainVerificationDTO = z.infer<typeof domainCheckSchema>;
export type SSLCertificateDTO = z.infer<typeof sslCertificateSchema>;
export type DomainsQueryDTO = z.infer<typeof domainsQuerySchema>;
