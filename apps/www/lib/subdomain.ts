/**
 * Extract the subdomain from a host string
 * Handles various cases including localhost, IP addresses, and multi-part subdomains
 * 
 * @param host The host string from request headers
 * @param defaultSubdomain The default subdomain to use if none can be extracted
 * @returns The extracted subdomain
 */
export function extractSubdomain(host: string, defaultSubdomain = 'demo'): string {
  // Handle local development with .localhost domains (e.g., kinetic-choir44.localhost)
  if (host.endsWith('.localhost') || host.includes('.localhost:')) {
    // Extract the part before .localhost, ignoring any port
    const subdomain = host.split('.localhost')[0];
    return subdomain || defaultSubdomain;
  }
  
  // Handle standard localhost
  if (host.includes('localhost')) {
    return host.split(':')[0] === 'localhost' ? defaultSubdomain : host.split(':')[0];
  }
  
  // Handle direct IP address access
  if (/^\d+\.\d+\.\d+\.\d+/.test(host)) {
    return defaultSubdomain;
  }
  
  // Handle production domains
  const hostParts = host.split('.');
  
  // If we have a multi-part domain (more than 2 parts)
  if (hostParts.length > 2) {
    // Extract everything except the main domain (last 2 parts)
    return hostParts.slice(0, -2).join('.');
  }
  
  // If we're on the main domain (e.g., mortarstudio.site)
  return defaultSubdomain;
}
