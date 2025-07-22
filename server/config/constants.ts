// Application Configuration Constants

// Session Configuration
export const SESSION_CONFIG = {
  MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  SECRET: process.env.SESSION_SECRET || 'your-secret-key',
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  PROFILE_IMAGE: 5 * 1024 * 1024, // 5MB
  LISTING_IMAGE: 10 * 1024 * 1024, // 10MB
  MAX_LISTING_IMAGES: 20,
} as const;

// Server Configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  AUTH_STALE_TIME: 10 * 1000, // 10 seconds
  STATIC_DATA_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  DRAFT_LISTING_STALE_TIME: 2 * 60 * 1000, // 2 minutes
  GC_TIME: 15 * 60 * 1000, // 15 minutes
} as const;

// Database Query Optimization
export const DB_CONFIG = {
  MAX_CONNECTIONS: 15,
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  QUERY_TIMEOUT: 15000, // 15 seconds
} as const;