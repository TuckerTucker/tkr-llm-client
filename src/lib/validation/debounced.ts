/**
 * Debounced Validation
 *
 * Provides debounced validation to prevent excessive validation calls
 * during rapid changes (e.g., user typing in a form).
 *
 * @module lib/validation/debounced
 * @version 1.0.0
 * @author Validation & Preview Engineer (Agent 4)
 */

import type {
  ValidatableNode,
  ValidationContext,
  EnhancedValidationResult,
} from './pipeline';
import { validateNode } from './pipeline';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Debounced validator configuration.
 */
export interface DebouncedValidatorConfig {
  /** Debounce delay in milliseconds (default: 300ms) */
  delay?: number;

  /** Whether to validate on the leading edge (default: false) */
  leading?: boolean;

  /** Whether to validate on the trailing edge (default: true) */
  trailing?: boolean;

  /** Maximum wait time before forcing validation (default: none) */
  maxWait?: number;
}

/**
 * Pending validation state.
 */
interface PendingValidation {
  /** Timer ID for debounced call */
  timerId: NodeJS.Timeout | null;

  /** Promise resolver */
  resolve: (result: EnhancedValidationResult) => void;

  /** Promise rejector */
  reject: (error: Error) => void;

  /** Node to validate */
  node: ValidatableNode;

  /** Validation context */
  context?: ValidationContext;

  /** Timestamp when validation was queued */
  queuedAt: number;
}

// ============================================================================
// DEBOUNCED VALIDATOR CLASS
// ============================================================================

/**
 * Debounced validator that delays validation calls.
 *
 * Prevents excessive validation during rapid changes by debouncing
 * validation calls. Ensures only the most recent validation request
 * is executed after a quiet period.
 *
 * @example
 * ```typescript
 * const validator = new DebouncedValidator({ delay: 300 });
 *
 * // These rapid calls will be debounced
 * validator.validate({ type: 'template', data: template1 });
 * validator.validate({ type: 'template', data: template2 });
 * validator.validate({ type: 'template', data: template3 });
 *
 * // Only template3 will be validated (after 300ms quiet period)
 * const result = await validator.validate({ type: 'template', data: template3 });
 * ```
 */
export class DebouncedValidator {
  private config: Required<DebouncedValidatorConfig>;
  private pending = new Map<string, PendingValidation>();

  /**
   * Creates a new debounced validator.
   *
   * @param config - Debounce configuration
   */
  constructor(config?: DebouncedValidatorConfig) {
    this.config = {
      delay: config?.delay ?? 300,
      leading: config?.leading ?? false,
      trailing: config?.trailing ?? true,
      maxWait: config?.maxWait ?? Infinity,
    };
  }

  /**
   * Validates a node with debouncing.
   *
   * If called multiple times rapidly, only the last call will execute
   * (after the debounce delay).
   *
   * @param node - Node to validate
   * @param context - Optional validation context
   * @returns Promise that resolves with validation result
   *
   * @example
   * ```typescript
   * const result = await validator.validate(
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

    // Cancel pending validation for this key
    this.cancel(key);

    return new Promise((resolve, reject) => {
      const queuedAt = Date.now();
      const shouldValidateLeading =
        this.config.leading && !this.pending.has(key);

      // Leading edge validation (immediate)
      if (shouldValidateLeading) {
        this.executeValidation(node, context)
          .then(resolve)
          .catch(reject);

        // Don't queue trailing if leading succeeded and trailing is disabled
        if (!this.config.trailing) {
          return;
        }
      }

      // Trailing edge validation (debounced)
      const timerId = setTimeout(() => {
        this.pending.delete(key);

        this.executeValidation(node, context)
          .then(resolve)
          .catch(reject);
      }, this.config.delay);

      // Store pending validation
      this.pending.set(key, {
        timerId,
        resolve,
        reject,
        node,
        context,
        queuedAt,
      });

      // Set up maxWait timeout if configured
      if (this.config.maxWait < Infinity) {
        const maxWaitTimer = setTimeout(() => {
          this.flush(key);
        }, this.config.maxWait);

        // Store maxWait timer (we'll clear it when validation executes)
        const pending = this.pending.get(key);
        if (pending) {
          (pending as any).maxWaitTimer = maxWaitTimer;
        }
      }
    });
  }

  /**
   * Cancels pending validation for a specific key.
   *
   * @param key - Validation key (derived from node and context)
   *
   * @example
   * ```typescript
   * validator.cancel('my-template');
   * ```
   */
  cancel(key: string): void {
    const pending = this.pending.get(key);

    if (pending) {
      if (pending.timerId) {
        clearTimeout(pending.timerId);
      }

      // Clear maxWait timer if it exists
      if ((pending as any).maxWaitTimer) {
        clearTimeout((pending as any).maxWaitTimer);
      }

      this.pending.delete(key);
    }
  }

  /**
   * Cancels all pending validations.
   *
   * @example
   * ```typescript
   * validator.cancelAll();
   * ```
   */
  cancelAll(): void {
    for (const key of this.pending.keys()) {
      this.cancel(key);
    }
  }

  /**
   * Immediately executes pending validation for a specific key.
   *
   * @param key - Validation key
   *
   * @example
   * ```typescript
   * await validator.flush('my-template');
   * ```
   */
  async flush(key: string): Promise<void> {
    const pending = this.pending.get(key);

    if (pending) {
      if (pending.timerId) {
        clearTimeout(pending.timerId);
      }

      if ((pending as any).maxWaitTimer) {
        clearTimeout((pending as any).maxWaitTimer);
      }

      this.pending.delete(key);

      try {
        const result = await this.executeValidation(
          pending.node,
          pending.context
        );
        pending.resolve(result);
      } catch (error) {
        pending.reject(error as Error);
      }
    }
  }

  /**
   * Immediately executes all pending validations.
   *
   * @example
   * ```typescript
   * await validator.flushAll();
   * ```
   */
  async flushAll(): Promise<void> {
    const keys = Array.from(this.pending.keys());
    await Promise.all(keys.map(key => this.flush(key)));
  }

  /**
   * Gets the number of pending validations.
   *
   * @returns Number of pending validations
   *
   * @example
   * ```typescript
   * const count = validator.pendingCount();
   * console.log(`${count} validations pending`);
   * ```
   */
  pendingCount(): number {
    return this.pending.size;
  }

  /**
   * Checks if a specific key has a pending validation.
   *
   * @param key - Validation key
   * @returns True if validation is pending for this key
   *
   * @example
   * ```typescript
   * if (validator.isPending('my-template')) {
   *   console.log('Validation pending...');
   * }
   * ```
   */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  /**
   * Executes validation (internal helper).
   *
   * @param node - Node to validate
   * @param context - Validation context
   * @returns Validation result
   */
  private async executeValidation(
    node: ValidatableNode,
    context?: ValidationContext
  ): Promise<EnhancedValidationResult> {
    return validateNode(node, context);
  }

  /**
   * Generates a unique key for a node and context.
   *
   * @param node - Node to validate
   * @param context - Validation context
   * @returns Unique key string
   */
  private getKey(node: ValidatableNode, context?: ValidationContext): string {
    // Use nodeId if available, otherwise create a hash-like key
    if (context?.nodeId) {
      return context.nodeId;
    }

    // Fallback: create key from node type and data hash
    return `${node.type}-${this.hashData(node.data)}`;
  }

  /**
   * Creates a simple hash from data (for key generation).
   *
   * @param data - Data to hash
   * @returns Hash string
   */
  private hashData(data: unknown): string {
    // Simple JSON-based hash (not cryptographic, just for keying)
    try {
      const json = JSON.stringify(data);
      let hash = 0;

      for (let i = 0; i < json.length; i++) {
        const char = json.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      return hash.toString(36);
    } catch {
      // If data can't be stringified, use timestamp
      return Date.now().toString(36);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a debounced validation function.
 *
 * Convenience wrapper that creates a debounced validator and returns
 * a validation function.
 *
 * @param config - Debounce configuration
 * @returns Debounced validation function
 *
 * @example
 * ```typescript
 * const validate = createDebouncedValidator({ delay: 300 });
 *
 * // Use like a normal function
 * const result = await validate({ type: 'template', data: template });
 * ```
 */
export function createDebouncedValidator(
  config?: DebouncedValidatorConfig
): (node: ValidatableNode, context?: ValidationContext) => Promise<EnhancedValidationResult> {
  const validator = new DebouncedValidator(config);
  return (node, context) => validator.validate(node, context);
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports DebouncedValidator - Debounced validator class
 * @exports createDebouncedValidator - Create debounced validation function
 */
