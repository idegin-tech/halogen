
export function extractSubdomain(host: string, defaultSubdomain = 'demo'): string {
  if (host.endsWith('.localhost') || host.includes('.localhost:')) {
    const subdomain = host.split('.localhost')[0];
    return subdomain || defaultSubdomain;
  }
  
  if (host.includes('localhost')) {
    return host.split(':')[0] === 'localhost' ? defaultSubdomain : host.split(':')[0];
  }
  
  if (/^\d+\.\d+\.\d+\.\d+/.test(host)) {
    return defaultSubdomain;
  }
  
  const hostParts = host.split('.');
  
  if (hostParts.length > 2) {
    return hostParts.slice(0, -2).join('.');
  }
  
  return defaultSubdomain;
}
