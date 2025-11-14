/**
 * Validation Cache
 *
 * Memoizes validation results to avoid redundant validation of unchanged data.
 * Implements LRU (Least Recently Used) eviction policy with hash-based cache keys.
 *
 * @module lib/validation/cache
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

import type {
  ValidatableNode,
  ValidationContext,
  EnhancedValidationResult,
} from './pipeline';
import { validateNode } from './pipeline';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cache configuration.
 */
export interface ValidationCacheConfig {
  /** Maximum number of cached results (default: 100) */
  maxSize?: number;

  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;

  /** Whether to use content hashing (default: true) */
  useContentHashing?: boolean;
}

/**
 * Cache entry with metadata.
 */
interface CacheEntry {
  /** Cached validation result */
  result: EnhancedValidationResult;

  /** Content hash for invalidation */
  hash: string;

  /** Timestamp when entry was created */
  createdAt: number;

  /** Timestamp when entry was last accessed */
  lastAccessedAt: number;

  /** Number of times this entry was accessed */
  hitCount: number;
}

/**
 * Cache statistics.
 */
export interface CacheStats {
  /** Total number of cache hits */
  hits: number;

  /** Total number of cache misses */
  misses: number;

  /** Cache hit rate (0-1) */
  hitRate: number;

  /** Current cache size */
  size: number;

  /** Maximum cache size */
  maxSize: number;

  /** Number of evictions */
  evictions: number;

  /** Number of invalidations */
  invalidations: number;
}

// ============================================================================
// VALIDATION CACHE CLASS
// ============================================================================

/**
 * LRU cache for validation results.
 *
 * Stores validation results and returns cached results when validating
 * the same node again. Automatically invalidates cache when node content
 * changes (detected via content hashing).
 *
 * @example
 * ```typescript
 * const cache = new ValidationCache({ maxSize: 100, ttl: 300000 });
 *
 * // First call validates and caches
 * const result1 = await cache.validate({ type: 'template', data: template });
 *
 * // Second call returns cached result (instant)
 * const result2 = await cache.validate({ type: 'template', data: template });
 *
 * // Different data triggers new validation
 * const result3 = await cache.validate({ type: 'template', data: modifiedTemplate });
 * ```
 */
export class ValidationCache {
  private config: Required<ValidationCacheConfig>;
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    invalidations: 0,
  };

  /**
   * Creates a new validation cache.
   *
   * @param config - Cache configuration
   */
  constructor(config?: ValidationCacheConfig) {
    this.config = {
      maxSize: config?.maxSize ?? 100,
      ttl: config?.ttl ?? 300000, // 5 minutes
      useContentHashing: config?.useContentHashing ?? true,
    };
  }

  /**
   * Validates a node with caching.
   *
   * Returns cached result if available and valid, otherwise validates
   * and caches the result.
   *
   * @param node - Node to validate
   * @param context - Optional validation context
   * @returns Validation result (from cache or fresh)
   *
   * @example
   * ```typescript
   * const result = await cache.validate(
   *   { type: 'template', data: template },
   *   { nodeId: 'my-template' }
   * );
   * ```
   */
  async validate(
    node: ValidatableNode,
    context?: ValidationContext
  ): Promise<EnhancedValidationResult> {
    const key = this.getKey(node, context);
    const hash = this.config.useContentHashing
      ? this.hashNode(node)
      : '';

    // Check cache
    const cached = this.cache.get(key);

    if (cached) {
      // Check if cache entry is still valid
      if (this.isValid(cached, hash)) {
        // Cache hit
        this.stats.hits++;
        cached.lastAccessedAt = Date.now();
        cached.hitCount++;
        return cached.result;
      } else {
        // Cache entry invalidated (content changed or TTL expired)
        this.stats.invalidations++;
        this.cache.delete(key);
      }
    }

    // Cache miss - perform validation
    this.stats.misses++;

    const result = await validateNode(node, context);

    // Store in cache
    this.set(key, result, hash);

    return result;
  }

  /**
   * Stores a validation result in cache.
   *
   * @param key - Cache key
   * @param result - Validation result
   * @param hash - Content hash
   */
  private set(
    key: string,
    result: EnhancedValidationResult,
    hash: string
  ): void {
    // Check if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Add entry
    this.cache.set(key, {
      result,
      hash,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * Checks if a cache entry is still valid.
   *
   * @param entry - Cache entry
   * @param currentHash - Current content hash
   * @returns True if entry is valid
   */
  private isValid(entry: CacheEntry, currentHash: string): boolean {
    // Check TTL
    const age = Date.now() - entry.createdAt;
    if (age > this.config.ttl) {
      return false;
    }

    // Check content hash (if enabled)
    if (this.config.useContentHashing && entry.hash !== currentHash) {
      return false;
    }

    return true;
  }

  /**
   * Evicts the least recently used entry.
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find LRU entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    // Remove LRU entry
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Invalidates cache for a specific key.
   *
   * @param key - Cache key to invalidate
   *
   * @example
   * ```typescript
   * cache.invalidate('my-template');
   * ```
   */
  invalidate(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.invalidations++;
    }
  }

  /**
   * Invalidates all cache entries matching a predicate.
   *
   * @param predicate - Function to test each entry
   *
   * @example
   * ```typescript
   * // Invalidate all template entries
   * cache.invalidateWhere((key) => key.startsWith('template-'));
   * ```
   */
  invalidateWhere(predicate: (key: string) => boolean): void {
    for (const key of this.cache.keys()) {
      if (predicate(key)) {
        this.invalidate(key);
      }
    }
  }

  /**
   * Clears all cache entries.
   *
   * @example
   * ```typescript
   * cache.clear();
   * ```
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += count;
  }

  /**
   * Gets current cache statistics.
   *
   * @returns Cache statistics
   *
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
   * ```
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      evictions: this.stats.evictions,
      invalidations: this.stats.invalidations,
    };
  }

  /**
   * Resets cache statistics.
   *
   * @example
   * ```typescript
   * cache.resetStats();
   * ```
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      invalidations: 0,
    };
  }

  /**
   * Gets the number of entries in the cache.
   *
   * @returns Cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Checks if cache has an entry for a key.
   *
   * @param key - Cache key
   * @returns True if entry exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Generates cache key for a node and context.
   *
   * @param node - Node to validate
   * @param context - Validation context
   * @returns Cache key
   */
  private getKey(node: ValidatableNode, context?: ValidationContext): string {
    // Use nodeId if available
    if (context?.nodeId) {
      return context.nodeId;
    }

    // Fallback: create key from node type
    return `${node.type}-${this.hashNode(node)}`;
  }

  /**
   * Creates content hash for a node.
   *
   * @param node - Node to hash
   * @returns Content hash
   */
  private hashNode(node: ValidatableNode): string {
    try {
      // Use crypto hash for reliable content-based invalidation
      const json = JSON.stringify(node.data);
      return createHash('sha256').update(json).digest('hex').slice(0, 16);
    } catch {
      // If data can't be stringified, use timestamp (always miss cache)
      return Date.now().toString(36);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a cached validation function.
 *
 * Convenience wrapper that creates a validation cache and returns
 * a validation function.
 *
 * @param config - Cache configuration
 * @returns Cached validation function
 *
 * @example
 * ```typescript
 * const validate = createCachedValidator({ maxSize: 100, ttl: 300000 });
 *
 * // Use like a normal function (with caching)
 * const result = await validate({ type: 'template', data: template });
 * ```
 */
export function createCachedValidator(
  config?: ValidationCacheConfig
): (node: ValidatableNode, context?: ValidationContext) => Promise<EnhancedValidationResult> {
  const cache = new ValidationCache(config);
  return (node, context) => cache.validate(node, context);
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports ValidationCache - Validation cache class
 * @exports createCachedValidator - Create cached validation function
 */
