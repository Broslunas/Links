import { CustomDomain } from '@/models';

interface VercelDomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string;
  redirectStatusCode?: number;
  gitBranch?: string;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  configuredBy?: string;
  configuredChangedAt?: number;
  configuredChangeAttempts?: Array<{
    at: number;
    successful: boolean;
  }>;
}

interface VercelError {
  code: string;
  message: string;
}

interface VercelApiResponse<T = any> {
  data?: T;
  error?: VercelError;
}

class VercelIntegration {
  private token: string;
  private teamId?: string;
  private projectId: string;
  private baseUrl = 'https://api.vercel.com';

  constructor() {
    this.token = process.env.VERCEL_TOKEN || '';
    this.teamId = process.env.VERCEL_TEAM_ID;
    this.projectId = process.env.VERCEL_PROJECT_ID || '';

    if (!this.token) {
      throw new Error('VERCEL_TOKEN no está configurado en las variables de entorno');
    }

    if (!this.projectId) {
      throw new Error('VERCEL_PROJECT_ID no está configurado en las variables de entorno');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };

    if (this.teamId) {
      headers['X-Vercel-Team-Id'] = this.teamId;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<VercelApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'Error desconocido de Vercel',
          },
        };
      }

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Error de red',
        },
      };
    }
  }

  /**
   * Añadir un dominio al proyecto en Vercel
   */
  async addDomain(domain: string): Promise<VercelApiResponse<VercelDomainResponse>> {
    return this.makeRequest<VercelDomainResponse>(
      `/v9/projects/${this.projectId}/domains`,
      {
        method: 'POST',
        body: JSON.stringify({ name: domain }),
      }
    );
  }

  /**
   * Obtener información de un dominio específico
   */
  async getDomain(domain: string): Promise<VercelApiResponse<VercelDomainResponse>> {
    return this.makeRequest<VercelDomainResponse>(
      `/v9/projects/${this.projectId}/domains/${domain}`
    );
  }

  /**
   * Eliminar un dominio del proyecto
   */
  async removeDomain(domain: string): Promise<VercelApiResponse<{ uid: string }>> {
    return this.makeRequest<{ uid: string }>(
      `/v9/projects/${this.projectId}/domains/${domain}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Listar todos los dominios del proyecto
   */
  async listDomains(): Promise<VercelApiResponse<{ domains: VercelDomainResponse[] }>> {
    return this.makeRequest<{ domains: VercelDomainResponse[] }>(
      `/v9/projects/${this.projectId}/domains`
    );
  }

  /**
   * Verificar el estado de verificación de un dominio
   */
  async verifyDomain(domain: string): Promise<VercelApiResponse<VercelDomainResponse>> {
    return this.makeRequest<VercelDomainResponse>(
      `/v9/projects/${this.projectId}/domains/${domain}/verify`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Configurar un dominio con redirección
   */
  async configureDomainRedirect(
    domain: string,
    redirect: string,
    statusCode: number = 308
  ): Promise<VercelApiResponse<VercelDomainResponse>> {
    return this.makeRequest<VercelDomainResponse>(
      `/v9/projects/${this.projectId}/domains/${domain}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          redirect,
          redirectStatusCode: statusCode,
        }),
      }
    );
  }

  /**
   * Sincronizar un dominio personalizado con Vercel
   */
  async syncCustomDomain(customDomain: any): Promise<{
    success: boolean;
    error?: string;
    vercelData?: VercelDomainResponse;
  }> {
    try {
      // Primero intentar obtener el dominio existente
      const getDomainResult = await this.getDomain(customDomain.fullDomain);
      
      if (getDomainResult.data) {
        // El dominio ya existe, actualizar información local
        const vercelDomain = getDomainResult.data;
        
        customDomain.isVerified = vercelDomain.verified;
        customDomain.vercelDomainId = vercelDomain.name;
        
        // Actualizar estado SSL basado en verificación
        if (vercelDomain.verified) {
          customDomain.sslStatus = 'active';
          customDomain.sslError = undefined;
        } else if (vercelDomain.verification && vercelDomain.verification.length > 0) {
          const hasError = vercelDomain.verification.some(v => v.reason);
          if (hasError) {
            customDomain.sslStatus = 'error';
            customDomain.sslError = vercelDomain.verification.find(v => v.reason)?.reason;
          } else {
            customDomain.sslStatus = 'pending';
          }
        }
        
        await customDomain.save();
        
        return {
          success: true,
          vercelData: vercelDomain,
        };
      } else if (getDomainResult.error?.code === 'NOT_FOUND') {
        // El dominio no existe, crearlo
        const addDomainResult = await this.addDomain(customDomain.fullDomain);
        
        if (addDomainResult.error) {
          return {
            success: false,
            error: addDomainResult.error.message,
          };
        }
        
        const vercelDomain = addDomainResult.data!;
        
        customDomain.vercelDomainId = vercelDomain.name;
        customDomain.sslStatus = 'pending';
        
        await customDomain.save();
        
        return {
          success: true,
          vercelData: vercelDomain,
        };
      } else {
        return {
          success: false,
          error: getDomainResult.error?.message || 'Error desconocido',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Generar registros DNS requeridos para un dominio
   */
  generateDNSRecords(domain: string, subdomain?: string): Array<{
    type: string;
    name: string;
    value: string;
    ttl?: number;
  }> {
    const records = [];
    
    if (subdomain) {
      // Para subdominios, usar CNAME
      records.push({
        type: 'CNAME',
        name: subdomain,
        value: 'cname.vercel-dns.com',
        ttl: 3600,
      });
    } else {
      // Para dominios apex, usar A records
      records.push(
        {
          type: 'A',
          name: '@',
          value: '76.76.19.61',
          ttl: 3600,
        },
        {
          type: 'A',
          name: '@',
          value: '76.223.126.88',
          ttl: 3600,
        }
      );
    }
    
    return records;
  }
}

// Instancia singleton
let vercelIntegration: VercelIntegration | null = null;

export function getVercelIntegration(): VercelIntegration {
  if (!vercelIntegration) {
    vercelIntegration = new VercelIntegration();
  }
  return vercelIntegration;
}

export type { VercelDomainResponse, VercelError, VercelApiResponse };
export { VercelIntegration };