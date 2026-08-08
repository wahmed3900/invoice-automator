// lib/microservices/service-registry.ts
import { Service } from '@prisma/client';

export class ServiceRegistry {
  private services: Map<string, Service> = new Map();
  
  // Service discovery
  async getService(name: string): Promise<Service | null> {
    if (this.services.has(name)) {
      return this.services.get(name)!;
    }
    
    // Fetch from database/consul/etcd
    const service = await prisma.service.findUnique({
      where: { name }
    });
    
    if (service) {
      this.services.set(name, service);
    }
    
    return service;
  }
  
  // Health check
  async checkHealth(service: Service): Promise<boolean> {
    try {
      const response = await fetch(`${service.url}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Load balance between instances
  async getHealthyInstance(name: string): Promise<string | null> {
    const service = await this.getService(name);
    if (!service) return null;
    
    const instances = await prisma.serviceInstance.findMany({
      where: {
        serviceId: service.id,
        healthy: true,
      },
    });
    
    if (instances.length === 0) return null;
    
    // Round-robin selection
    const index = Math.floor(Math.random() * instances.length);
    return instances[index].url;
  }
}

// Service-to-service communication with retry
export class ServiceClient {
  async callService(serviceName: string, endpoint: string, options: RequestInit) {
    const registry = new ServiceRegistry();
    const url = await registry.getHealthyInstance(serviceName);
    
    if (!url) {
      throw new Error(`Service ${serviceName} unavailable`);
    }
    
    return fetch(`${url}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'X-Service': 'invoice-service',
        'X-Correlation-ID': crypto.randomUUID(),
        'X-Request-ID': crypto.randomUUID(),
      },
    });
  }
}