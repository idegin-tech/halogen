/**
 * Domain Blacklist
 * List of domains that are not allowed to be registered for security or policy reasons
 */
export const blacklistedDomains = [
  // Reserved domains
  'localhost',
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'localhost.com',
  
  // Company domains
  'mortarstudio.com',
  'mortarstudio.site',
  'halogen.dev',
  'halogen.cloud',
  
  // Top-level domains as full domains
  'com',
  'org',
  'net',
  'io',
  'dev',
  'app',
  
  // Common email providers
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  
  // Other sensitive domains
  'admin',
  'administrator',
  'root',
  'system',
  'billing',
  'payment',
  'account',
  'security',
  'login',
  'auth',
  'api'
];

/**
 * Checks if a domain is blacklisted
 */
export function isDomainBlacklisted(domain: string): boolean {
  const normalizedDomain = domain.toLowerCase().trim();
  
  // Check exact matches
  if (blacklistedDomains.includes(normalizedDomain)) {
    return true;
  }
  
  // Check if domain ends with .blacklisted.domain
  for (const blacklisted of blacklistedDomains) {
    if (normalizedDomain.endsWith(`.${blacklisted}`)) {
      return true;
    }
  }
  
  return false;
}
