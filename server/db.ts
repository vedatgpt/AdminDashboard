import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Production-ready Neon configuration
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = process.env.NODE_ENV === 'production'; // Secure in production
neonConfig.pipelineConnect = false; // Disable for stability
neonConfig.pipelineTLS = false; // Disable for stability

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('DATABASE_URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Production-safe connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reasonable pool size for production
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds connection timeout
  allowExitOnIdle: false, // Keep connections alive
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development' // Only log in development
});

// Test database connection
pool.query('SELECT 1').then(() => {
  console.log('✅ Database connection successful');
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
});