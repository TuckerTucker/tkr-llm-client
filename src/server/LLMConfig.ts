/**
 * Configuration for local LLM server integration
 *
 * This module provides type-safe configuration loading and validation
 * for the LLM server process manager.
 */

/**
 * Configuration for local LLM server
 */
export interface LLMServerConfig {
  /**
   * Enable local LLM server (if false, skip initialization)
   */
  enabled: boolean;

  /**
   * Port for FastAPI server
   * @default 42002
   */
  port: number;

  /**
   * Full path to Python interpreter
   * @example "./llm_server/venv/bin/python"
   */
  pythonPath: string;

  /**
   * Path to server script (relative to project root)
   * @default "./llm-server/server.py"
   */
  serverScript: string;

  /**
   * Health check endpoint URL
   * @computed "http://localhost:{port}/health"
   */
  healthCheckUrl: string;

  /**
   * Maximum time to wait for server startup (milliseconds)
   * @default 30000
   */
  healthCheckTimeout: number;

  /**
   * Interval between health check polls (milliseconds)
   * @default 1000
   */
  healthCheckInterval: number;

  /**
   * Auto-restart server on crash
   * @default false
   */
  autoRestart: boolean;

  /**
   * Logging verbosity
   * @default "info"
   */
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Environment variables to pass to Python process
   */
  env: Record<string, string>;
}

/**
 * Default configuration values
 */
export const DEFAULT_LLM_CONFIG: Partial<LLMServerConfig> = {
  enabled: true,
  port: 42002,
  serverScript: './llm_server/server.py',
  healthCheckTimeout: 300000, // 5 minutes for initial model download
  healthCheckInterval: 1000,
  autoRestart: false,
  logLevel: 'info',
};

/**
 * Load configuration from environment variables
 *
 * @returns Fully populated LLMServerConfig
 */
export function loadLLMConfig(): LLMServerConfig {
  const port = parseInt(process.env['LLM_PORT'] || '42002', 10);

  return {
    enabled: process.env['LLM_ENABLED'] !== 'false',
    port,
    pythonPath: process.env['LLM_PYTHON_PATH'] || '',
    serverScript: process.env['LLM_SERVER_SCRIPT'] || './llm-server/server.py',
    healthCheckUrl: `http://localhost:${port}/health`,
    healthCheckTimeout: parseInt(process.env['LLM_HEALTH_CHECK_TIMEOUT'] || '300000', 10),
    healthCheckInterval: parseInt(process.env['LLM_HEALTH_CHECK_INTERVAL'] || '1000', 10),
    autoRestart: process.env['LLM_AUTO_RESTART'] === 'true',
    logLevel: (process.env['LLM_LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info',
    env: {
      PYTHONUNBUFFERED: '1',
      // Set PYTHONPATH to library package directory so Python can find llm_server module
      PYTHONPATH: (() => {
        const path = require('path');
        // If running from ACE (tkr-ace/), point to packages/llm-client/
        // If running standalone, use current directory
        const cwd = process.cwd();
        if (cwd.includes('tkr-ace') && !cwd.includes('llm-client')) {
          return path.join(cwd, 'packages/llm-client');
        }
        return cwd;
      })(),
      LLM_PORT: port.toString(),
      LLM_MODEL_PATH: process.env['LLM_MODEL_PATH'] || './models',
      LLM_MODEL_NAME: process.env['LLM_MODEL_NAME'] || 'gpt-oss-20b',
      LLM_DEVICE: process.env['LLM_DEVICE'] || 'auto',
      LLM_QUANTIZATION: process.env['LLM_QUANTIZATION'] || 'int4',
      // Redirect Hugging Face cache to local models directory (must be absolute path)
      HF_HOME: (() => {
        const hfHome = process.env['HF_HOME'] || './models';
        // Convert relative path to absolute
        const path = require('path');
        return path.isAbsolute(hfHome) ? hfHome : path.join(process.cwd(), hfHome);
      })(),
    },
  };
}

/**
 * Validate LLM configuration
 *
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateLLMConfig(config: LLMServerConfig): void {
  if (config.enabled) {
    if (!config.pythonPath) {
      throw new Error('LLM_PYTHON_PATH required when LLM_ENABLED=true');
    }
    if (config.port < 1024 || config.port > 65535) {
      throw new Error(`Invalid port: ${config.port}. Must be between 1024 and 65535`);
    }
    if (config.healthCheckTimeout < 1000) {
      throw new Error('Health check timeout must be >= 1000ms');
    }
    if (config.healthCheckInterval < 100) {
      throw new Error('Health check interval must be >= 100ms');
    }
    if (config.healthCheckInterval > config.healthCheckTimeout) {
      throw new Error('Health check interval cannot exceed timeout');
    }
  }
}

/**
 * Base error for LLM server issues
 */
export class LLMServerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'LLMServerError';

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, LLMServerError.prototype);
  }
}

/**
 * Server failed to start
 */
export class ServerStartupError extends LLMServerError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ServerStartupError';
    Object.setPrototypeOf(this, ServerStartupError.prototype);
  }
}

/**
 * Health check failed
 */
export class HealthCheckError extends LLMServerError {
  constructor(
    message: string,
    public readonly attempts: number,
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'HealthCheckError';
    Object.setPrototypeOf(this, HealthCheckError.prototype);
  }
}

/**
 * Process management error
 */
export class ProcessManagementError extends LLMServerError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ProcessManagementError';
    Object.setPrototypeOf(this, ProcessManagementError.prototype);
  }
}
