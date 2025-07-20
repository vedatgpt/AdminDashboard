// In-memory cache implementation for high-performance data retrieval
import type { Category, CategoryCustomField } from "@shared/schema";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Cache keys for different data types
  static keys = {
    categories: 'categories:all',
    categoriesTree: 'categories:tree',
    categoryPath: (id: number) => `category:${id}:path`,
    categoryChildren: (parentId: number | null) => `category:${parentId}:children`,
    customFields: (categoryId: number) => `category:${categoryId}:custom-fields`,
    categoryMetadata: (categoryId: number) => `category:${categoryId}:metadata`,
  };
}

// Global cache instance
export const cache = new MemoryCache();

// Auto cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000);