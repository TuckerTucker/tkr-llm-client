/**
 * Performance Optimization Utilities
 *
 * Utilities for performance monitoring, optimization, and virtual scrolling.
 *
 * @module lib/performance/optimization
 * @version 1.0.0
 * @author Performance Engineer - Wave 3
 */

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Simple memoization for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func.apply(this, args);
    cache.set(key, result);

    return result;
  } as T;
}

/**
 * Memoization with LRU eviction
 */
export function memoizeLRU<T extends (...args: any[]) => any>(func: T, maxSize: number = 100): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      // Move to end (most recently used)
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = func.apply(this, args);

    // Evict oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value as string;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, result);

    return result;
  } as T;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance metrics
 */
export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, func: () => T, metadata?: Record<string, any>): T {
    const start = performance.now();
    const result = func();
    const duration = performance.now() - start;

    this.addMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return result;
  }

  /**
   * Measure async function
   */
  async measureAsync<T>(name: string, func: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    const result = await func();
    const duration = performance.now() - start;

    this.addMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return result;
  }

  /**
   * Start a timer
   */
  start(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.addMetric({
        name,
        duration,
        timestamp: Date.now(),
      });
    };
  }

  /**
   * Add metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Generate report
   */
  generateReport(): string {
    const metricsByName = new Map<string, PerformanceMetric[]>();

    this.metrics.forEach((metric) => {
      if (!metricsByName.has(metric.name)) {
        metricsByName.set(metric.name, []);
      }
      metricsByName.get(metric.name)!.push(metric);
    });

    const lines: string[] = ['Performance Report', '='.repeat(50), ''];

    metricsByName.forEach((metrics, name) => {
      const durations = metrics.map((m) => m.duration);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      lines.push(`${name}:`);
      lines.push(`  Count: ${metrics.length}`);
      lines.push(`  Avg: ${avg.toFixed(2)}ms`);
      lines.push(`  Min: ${min.toFixed(2)}ms`);
      lines.push(`  Max: ${max.toFixed(2)}ms`);
      lines.push('');
    });

    return lines.join('\n');
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// VIRTUAL SCROLLING
// ============================================================================

/**
 * Calculate visible range for virtual scrolling
 */
export interface VirtualScrollRange {
  startIndex: number;
  endIndex: number;
  offsetY: number;
}

/**
 * Calculate visible items for virtual scrolling
 */
export function calculateVirtualScrollRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): VirtualScrollRange {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    offsetY,
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process items in batches to avoid blocking the main thread
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 100,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);

    // Yield to event loop
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Lazy load function
 */
export function lazyLoad<T>(loader: () => Promise<T>): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return async () => {
    if (cached !== null) {
      return cached;
    }

    if (loading) {
      return loading;
    }

    loading = loader();
    cached = await loading;
    loading = null;

    return cached;
  };
}

// ============================================================================
// REQUEST ANIMATION FRAME QUEUE
// ============================================================================

/**
 * Queue function to run on next animation frame
 */
export function queueAnimationFrame(callback: () => void): void {
  requestAnimationFrame(callback);
}

/**
 * Batch multiple updates into a single animation frame
 */
export class AnimationFrameBatcher {
  private pending = new Set<() => void>();
  private rafId: number | null = null;

  /**
   * Queue a callback
   */
  queue(callback: () => void): void {
    this.pending.add(callback);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  /**
   * Flush all pending callbacks
   */
  private flush(): void {
    const callbacks = Array.from(this.pending);
    this.pending.clear();
    this.rafId = null;

    callbacks.forEach((cb) => cb());
  }

  /**
   * Cancel all pending callbacks
   */
  cancel(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pending.clear();
  }
}

// Global animation frame batcher
export const animationFrameBatcher = new AnimationFrameBatcher();
