API Rate Limiting  Throttling for 10K Users_backend.ts
// lib/ratelimit/advanced-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Multi-tier rate limiting
export class RateLimiter {
  private static instances: Map<string, Ratelimit> = new Map();
  
  static getLimiter(plan: string = 'free'): Ratelimit {
    const key = `ratelimit:${plan}`;
    
    if (!this.instances.has(key)) {
      const limits = {
        free: { tokens: 10, window: '10s' },      // 1 req/sec
        pro: { tokens: 100, window: '10s' },      // 10 req/sec
        business: { tokens: 500, window: '10s' }, // 50 req/sec
        enterprise: { tokens: 1000, window: '10s' }, // 100 req/sec
      };
      
      const config = limits[plan as keyof typeof limits] || limits.free;
      
      this.instances.set(key, new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(config.tokens, config.window),
        analytics: true,
        prefix: '@upstash/ratelimit',
        timeout: 1000,
      }));
    }
    
    return this.instances.get(key)!;
  }
  
  static async checkLimit(request: Request) {
    const headersList = headers();
    const userId = headersList.get('x-user-id') || 'anonymous';
    const plan = headersList.get('x-plan') || 'free';
    
    const limiter = this.getLimiter(plan);
    const { success, limit, reset, remaining } = await limiter.limit(userId);
    
    return {
      success,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    };
  }
}

// API route middleware
export async function withRateLimit(request: Request, handler: () => Promise<Response>) {
  const { success, headers } = await RateLimiter.checkLimit(request);
  
  if (!success) {
    return new Response(JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    }), {
      status: 429,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  }
  
  return handler();
}