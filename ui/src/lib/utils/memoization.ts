/**
 * Memoization Utilities
 *
 * Provides memoization utilities for expensive operations like template
 * conversion, layout calculations, and other computations.
 *
 * @module lib/utils/memoization
 * @version 1.0.0
 * @author Performance Optimization Engineer (Agent 2)
 */

import type { AgentTemplate } from '@backend/templates/types';
import type { Node, Edge } from 'reactflow';
import type { TemplateConversionResult } from '../converters/templateToReactFlow';
import type { LayoutAlgorithm } from '../../hooks/useAutoLayout';

/**
 * Layout configuration for caching
 */
export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  nodeSpacing?: number;
  rankSep?: number;
  nodeSep?: number;
  edgeSep?: number;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
}

/**
 * Layout result from layout engine
 */
export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
  bounds?: {
    width: number;
    height: number;
  };
}

/**
 * Cache entry with timestamp for expiration
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

/**
 * Memoization cache options
 */
export interface MemoizationOptions {
  /** Maximum cache size (default: 100) */
  maxSize?: number;

  /** TTL in milliseconds (default: 5 minutes) */
  ttl?: number;

  /** Whether to enable cache (default: true) */
  enabled?: boolean;

  /** Custom key generator */
  keyGenerator?: (...args: any[]) => string;
}

const DEFAULT_OPTIONS: Required<Omit<MemoizationOptions, 'keyGenerator'>> = {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  enabled: true,
};

/**
 * Generic memoization cache class
 */
class MemoizationCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(private options: Required<Omit<MemoizationOptions, 'keyGenerator'>>) {}

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    if (!this.options.enabled) return undefined;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.options.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Cache hit
    entry.hits++;
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T): void {
    if (!this.options.enabled) return;

    // Evict oldest if at max size
    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      evictions: this.stats.evictions,
    };
  }

  /**
   * Find oldest entry for eviction
   */
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}

// ============================================================================
// TEMPLATE CONVERSION MEMOIZATION
// ============================================================================

const conversionCache = new MemoizationCache<TemplateConversionResult>(DEFAULT_OPTIONS);

/**
 * Memoize template to ReactFlow conversion
 *
 * Caches conversion results based on template name and version.
 * Significantly improves performance when switching between templates.
 *
 * @param converter - Conversion function to memoize
 * @returns Memoized conversion function
 *
 * @example
 * ```typescript
 * const memoizedConverter = memoizeConverter(convertTemplateToReactFlow);
 * const result = memoizedConverter(template); // Cached on subsequent calls
 * ```
 */
export function memoizeConverter<T extends AgentTemplate>(
  converter: (template: T) => TemplateConversionResult
): (template: T) => TemplateConversionResult {
  return (template: T): TemplateConversionResult => {
    // Generate cache key from template metadata
    const key = generateTemplateKey(template);

    // Try cache first
    const cached = conversionCache.get(key);
    if (cached) {
      return cached;
    }

    // Not in cache - run conversion
    const result = converter(template);

    // Cache result
    conversionCache.set(key, result);

    return result;
  };
}

/**
 * Clear conversion cache
 */
export function clearConversionCache(): void {
  conversionCache.clear();
}

/**
 * Get conversion cache statistics
 */
export function getConversionCacheStats(): CacheStats {
  return conversionCache.getStats();
}

// ============================================================================
// LAYOUT CALCULATION MEMOIZATION
// ============================================================================

const layoutCache = new MemoizationCache<LayoutResult>({
  ...DEFAULT_OPTIONS,
  maxSize: 50, // Smaller cache for layouts
});

/**
 * Memoize layout calculation
 *
 * Caches layout results based on node IDs, edge IDs, and algorithm settings.
 * Prevents expensive recalculations when layout hasn't changed.
 *
 * @param layoutFn - Layout function to memoize
 * @returns Memoized layout function
 *
 * @example
 * ```typescript
 * const memoizedLayout = memoizeLayout(calculateDagreLayout);
 * const result = memoizedLayout(nodes, edges, config); // Cached if inputs match
 * ```
 */
export function memoizeLayout(
  layoutFn: (nodes: Node[], edges: Edge[], config: LayoutConfig) => LayoutResult
): (nodes: Node[], edges: Edge[], config: LayoutConfig) => LayoutResult {
  return (nodes: Node[], edges: Edge[], config: LayoutConfig): LayoutResult => {
    // Generate cache key from inputs
    const key = generateLayoutKey(nodes, edges, config);

    // Try cache first
    const cached = layoutCache.get(key);
    if (cached) {
      return cached;
    }

    // Not in cache - run layout
    const result = layoutFn(nodes, edges, config);

    // Cache result
    layoutCache.set(key, result);

    return result;
  };
}

/**
 * Clear layout cache
 */
export function clearLayoutCache(): void {
  layoutCache.clear();
}

/**
 * Get layout cache statistics
 */
export function getLayoutCacheStats(): CacheStats {
  return layoutCache.getStats();
}

// ============================================================================
// GENERIC MEMOIZATION
// ============================================================================

/**
 * Create a memoized version of any function
 *
 * Generic memoization utility with customizable options.
 *
 * @param fn - Function to memoize
 * @param options - Memoization options
 * @returns Memoized function
 *
 * @example
 * ```typescript
 * const memoizedFn = memoize(
 *   (a: number, b: number) => expensiveCalculation(a, b),
 *   { maxSize: 50 }
 * );
 * ```
 */
export function memoize<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: MemoizationOptions = {}
): (...args: TArgs) => TResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cache = new MemoizationCache<TResult>(opts);

  const keyGenerator = options.keyGenerator || defaultKeyGenerator;

  return (...args: TArgs): TResult => {
    const key = keyGenerator(...args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  };
}

// ============================================================================
// KEY GENERATION HELPERS
// ============================================================================

/**
 * Generate cache key for template
 */
function generateTemplateKey(template: AgentTemplate): string {
  const { name, version, extends: ext, mixins } = template.metadata;

  const parts = [
    name,
    version || '0.0.0',
    ext || '',
    mixins ? mixins.join(',') : '',
  ];

  return parts.join('::');
}

/**
 * Generate cache key for layout
 */
function generateLayoutKey(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig
): string {
  // Use node IDs and edge IDs for cache key
  const nodeIds = nodes.map((n) => n.id).sort().join(',');
  const edgeIds = edges.map((e) => e.id).sort().join(',');

  // Include config in key
  const configKey = [
    config.algorithm,
    config.nodeSpacing || 0,
    config.rankSep || 0,
    config.nodeSep || 0,
    config.edgeSep || 0,
    config.direction || 'TB',
  ].join(':');

  return `${nodeIds}::${edgeIds}::${configKey}`;
}

/**
 * Default key generator using JSON.stringify
 */
function defaultKeyGenerator(...args: any[]): string {
  return JSON.stringify(args);
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  conversionCache.clear();
  layoutCache.clear();
}

/**
 * Get all cache statistics
 */
export function getAllCacheStats(): {
  conversion: CacheStats;
  layout: CacheStats;
} {
  return {
    conversion: conversionCache.getStats(),
    layout: layoutCache.getStats(),
  };
}

/**
 * Log cache statistics to console (dev only)
 */
export function logCacheStats(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const stats = getAllCacheStats();

  console.group('[Performance] Cache Statistics');
  console.table({
    'Conversion Cache': stats.conversion,
    'Layout Cache': stats.layout,
  });
  console.groupEnd();
}
