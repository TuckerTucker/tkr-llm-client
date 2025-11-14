/**
 * Adapter Error Handling
 *
 * Custom error classes for adapter conversion failures.
 *
 * @module lib/adapters/errors
 * @version 1.0.0
 * @author Data Bridge Engineer (Agent 1)
 */

/**
 * Adapter conversion error.
 *
 * Thrown when conversion between template system types and UI types fails.
 */
export class AdapterError extends Error {
  /**
   * Creates a new adapter error.
   *
   * @param message - Error description
   * @param source - Source data that failed conversion
   * @param type - Type of data being converted
   */
  constructor(
    message: string,
    public readonly source: any,
    public readonly type: 'template' | 'fragment' | 'config' | 'variable' | 'edge'
  ) {
    super(message);
    this.name = 'AdapterError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}
