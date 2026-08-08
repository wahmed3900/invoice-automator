Caching Strategy for Performance.ts
// lib/cache/redis-cluster.ts
import { RedisCluster } from '@upstash/redis';
import { redis } from '@/lib/redis';

// Multi-level cache
export class CacheService {
  private static instance: CacheService;
  
  // L1: In-memory cache (Node.js cache)
  private memoryCache = new Map();
  
  // L2: Redis cluster
  private redisClient = redis;
  
  // L3: CDN (CloudFlare)
  
  async get<T>(key: string): Promise<T | null> {
    // Check L1 cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }
    
    // Check L2 cache
    const cached = await this.redisClient.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      // Store in L1 for future requests
      this.memoryCache.set(key, data);
      return data;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600) {
    // Store in L1
    this.memoryCache.set(key, value);
    
    // Store in L2 with TTL
    await this.redisClient.setex(key, ttl, JSON.stringify(value));
    
    // Invalidate CDN if needed
    // await this.invalidateCDN(key);
  }
  
  // Invalidate across all layers
  async invalidate(pattern: string) {
    this.memoryCache.clear();
    await this.redisClient.del(pattern);
    // Purge CDN
  }
}

// Cache strategies
export const cacheStrategies = {
  // Invoices - cache for 5 minutes
  INVOICE: { ttl: 300, staleTime: 60 },
  
  // User data - cache for 1 hour
  USER: { ttl: 3600, staleTime: 300 },
  
  // Reports - cache for 1 day
  REPORT: { ttl: 86400, staleTime: 3600 },
  
  // Never cache - real-time data
  REAL_TIME: { ttl: 0, staleTime: 0 },
};