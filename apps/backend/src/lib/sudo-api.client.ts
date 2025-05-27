import fetch from 'node-fetch';
import Logger from '../config/logger.config';

const SUDO_API_BASE_URL = process.env.SUDO_API_BASE_URL || 'http://localhost:8082';

export interface SudoApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface DomainSetupRequest {
  domain: string;
  project_id: string;
  ssl_enabled: boolean;
  email: string;
}

export interface NginxConfigRequest {
  domain: string;
  project_id: string;
  ssl_enabled: boolean;
  config_content?: string;
}

export interface SSLCertificateRequest {
  domain: string;
  project_id: string;
  email: string;
  force_renewal?: boolean;
}

export interface DomainRequest {
  domain: string;
  project_id: string;
}

/**
 * HTTP client for communicating with the Python Sudo API
 */
export class SudoApiClient {
  private static async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<SudoApiResponse<T>> {
    try {
      const url = `${SUDO_API_BASE_URL}${endpoint}`;
      
      Logger.info(`[SUDO_API] ${method} ${url}`);
      
      const options: any = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minutes timeout for long operations
      };

      if (data && method === 'POST') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json() as SudoApiResponse<T>;
      
      Logger.info(`[SUDO_API] Response: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
      
      return result;
    } catch (error) {
      Logger.error(`[SUDO_API] Error calling ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check health of the Sudo API
   */
  static async healthCheck(): Promise<SudoApiResponse> {
    return this.makeRequest('GET', '/health');
  }

  /**
   * Deploy Nginx configuration for a domain
   */
  static async deployNginxConfig(request: NginxConfigRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/nginx/deploy', request);
  }

  /**
   * Remove Nginx configuration for a domain
   */
  static async removeNginxConfig(request: DomainRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/nginx/remove', request);
  }

  /**
   * Get Nginx configuration status for a domain
   */
  static async getNginxStatus(domain: string): Promise<SudoApiResponse> {
    return this.makeRequest('GET', `/nginx/status/${domain}`);
  }

  /**
   * Generate SSL certificate for a domain
   */
  static async generateSSLCertificate(request: SSLCertificateRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/ssl/generate', request);
  }

  /**
   * Renew SSL certificate for a domain
   */
  static async renewSSLCertificate(request: DomainRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/ssl/renew', request);
  }

  /**
   * Get SSL certificate status for a domain
   */
  static async getSSLStatus(domain: string): Promise<SudoApiResponse> {
    return this.makeRequest('GET', `/ssl/status/${domain}`);
  }

  /**
   * Remove SSL certificate for a domain
   */
  static async removeSSLCertificate(request: DomainRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/ssl/remove', request);
  }

  /**
   * Complete domain setup (Nginx + SSL)
   */
  static async setupDomain(request: DomainSetupRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/domain/complete-setup', request);
  }

  /**
   * Complete domain cleanup (remove Nginx + SSL)
   */
  static async cleanupDomain(request: DomainRequest): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/domain/cleanup', request);
  }

  /**
   * Get domain DNS propagation and verification status
   */
  static async getDomainStatus(domain: string): Promise<SudoApiResponse> {
    return this.makeRequest('GET', `/domain/status/${domain}`);
  }

  /**
   * Verify domain ownership with a verification token
   */
  static async verifyDomainOwnership(domain: string, token: string): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/domain/verify', { domain, token });
  }

  /**
   * Reload Nginx to apply new configurations
   */
  static async reloadNginx(): Promise<SudoApiResponse> {
    return this.makeRequest('POST', '/nginx/reload');
  }

  /**
   * Get TXT records for a domain
   */
  static async getDomainTxtRecords(domain: string): Promise<SudoApiResponse<{records: string[][]}>> {
    return this.makeRequest('GET', `/domain/txt-records/${domain}`);
  }
}
