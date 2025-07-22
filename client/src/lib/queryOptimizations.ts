// Query optimization utilities

// Optimized query configurations for different data types
export const QUERY_CONFIGS = {
  // Static data that rarely changes
  STATIC_DATA: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // User-specific data that changes more frequently
  USER_DATA: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  // Real-time data like drafts
  REALTIME_DATA: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  
  // Authentication data
  AUTH_DATA: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
} as const;

// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordQueryTime(queryKey: string, duration: number): void {
    if (!this.metrics.has(queryKey)) {
      this.metrics.set(queryKey, []);
    }
    
    const times = this.metrics.get(queryKey)!;
    times.push(duration);
    
    // Keep only last 50 measurements
    if (times.length > 50) {
      times.shift();
    }
  }

  getAverageTime(queryKey: string): number {
    const times = this.metrics.get(queryKey);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getSlowQueries(threshold: number = 1000): Array<{ query: string; avgTime: number }> {
    const slowQueries: Array<{ query: string; avgTime: number }> = [];
    
    for (const [query, times] of this.metrics) {
      const avgTime = this.getAverageTime(query);
      if (avgTime > threshold) {
        slowQueries.push({ query, avgTime });
      }
    }
    
    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }
}