 Connection Pooling for 10K Concurrent Users.ts
// lib/db/connection-pool.ts
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

// Connection pool configuration
export const poolConfig = {
  max: 100, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500, // Close connections after 7500 uses
};

// Prisma with connection pooling
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pool_timeout=30&connection_limit=100'
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info'] : ['error'],
});

// PgBouncer configuration (external)
// pgbouncer.ini
// pool_mode = transaction
// max_client_conn = 10000
// default_pool_size = 100
// reserve_pool_size = 20