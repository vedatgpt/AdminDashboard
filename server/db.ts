import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Optimize Neon configuration for better performance
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Use fetch for better performance
neonConfig.useSecureWebSocket = false; // Reduce overhead in development

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Max connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // 10s connection timeout
});

export const db = drizzle({ 
  client: pool, 
  schema,
  logger: false // Disable query logging for better performance
});