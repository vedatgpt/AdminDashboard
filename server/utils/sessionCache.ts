/**
 * Session Cache System for Performance Optimization
 * Maintains database-driven sessions while adding memory cache layer
 */

interface CachedSession {
  sessionData: any;
  lastAccessed: number;
  expiresAt: number;
}

export class SessionCache {
  private cache = new Map<string, CachedSession>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes cache TTL
  private readonly CLEANUP_INTERVAL = 2 * 60 * 1000; // 2 minutes cleanup
  private cleanupTimer: any = null;

  constructor() {
    this.startCleanupTimer();
  }

  // Get session from cache or return null if not found/expired
  get(sessionId: string): any | null {
    const cached = this.cache.get(sessionId);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > cached.expiresAt) {
      this.cache.delete(sessionId);
      return null;
    }

    // Update last accessed time
    cached.lastAccessed = now;
    return cached.sessionData;
  }

  // Set session in cache
  set(sessionId: string, sessionData: any): void {
    const now = Date.now();
    
    this.cache.set(sessionId, {
      sessionData: JSON.parse(JSON.stringify(sessionData)), // Deep clone
      lastAccessed: now,
      expiresAt: now + this.TTL
    });
  }

  // Remove session from cache
  delete(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  // Clear all cached sessions
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  // Start automatic cleanup of expired sessions
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  // Clean up expired sessions
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, cached] of Array.from(this.cache.entries())) {
      if (now > cached.expiresAt) {
        this.cache.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`SessionCache: Cleaned ${cleaned} expired sessions`);
    }
  }

  // Graceful shutdown
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const sessionCache = new SessionCache();

// Graceful shutdown handler
process.on('SIGTERM', () => {
  sessionCache.destroy();
});

process.on('SIGINT', () => {
  sessionCache.destroy();
});