/**
 * Configuration for local LLM server integration
 *
 * This module provides type-safe configuration loading and validation
 * for the LLM server process manager.
 *
 * Configuration priority (highest to lowest):
 * 1. Environment variables (.env)
 * 2. YAML configuration (llm.config.yml)
 * 3. Default values
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * YAML configuration file structure
 */
interface YAMLConfig {
  server?: {
    enabled?: boolean;
    port?: number;
    host?: string;
    workers?: number;
    pythonPath?: string;
    scriptPath?: string;
    healthCheck?: {
      timeout?: number;
      interval?: number;
    };
    autoRestart?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
  model?: {
    name?: string;
    path?: string;
    device?: string;
    quantization?: string;
  };
  huggingface?: {
    home?: string;
  };
  integration?: {
    anthropicBaseUrl?: string;
    enableCloudFallback?: boolean;
    streaming?: boolean;
  };
}

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
 * Load YAML configuration file
 *
 * @param configPath Path to llm.config.yml
 * @returns Parsed YAML config or empty object if file doesn't exist
 */
function loadYAMLConfig(configPath: string = 'llm.config.yml'): YAMLConfig {
  try {
    const fullPath = path.isAbsolute(configPath)
      ? configPath
      : path.join(process.cwd(), configPath);

    if (!fs.existsSync(fullPath)) {
      return {};
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return yaml.load(fileContents) as YAMLConfig;
  } catch (error) {
    console.warn(`Failed to load YAML config: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

/**
 * Load configuration from YAML file and environment variables
 *
 * Priority: ENV > YAML > Defaults
 *
 * @returns Fully populated LLMServerConfig
 */
export function loadLLMConfig(): LLMServerConfig {
  // Load YAML configuration
  const yamlConfig = loadYAMLConfig();

  // Resolve port (ENV > YAML > Default)
  const port = parseInt(
    process.env['LLM_PORT'] ||
    yamlConfig.server?.port?.toString() ||
    '42002',
    10
  );

  // Resolve host (ENV > YAML > Default)
  const host = process.env['LLM_HOST'] || yamlConfig.server?.host || '127.0.0.1';

  return {
    enabled: process.env['LLM_ENABLED'] !== 'false' && (yamlConfig.server?.enabled !== false),
    port,
    pythonPath: process.env['LLM_PYTHON_PATH'] || yamlConfig.server?.pythonPath || '',
    serverScript: process.env['LLM_SERVER_SCRIPT'] || yamlConfig.server?.scriptPath || './llm_server/server.py',
    healthCheckUrl: `http://${host}:${port}/health`,
    healthCheckTimeout: parseInt(
      process.env['LLM_HEALTH_CHECK_TIMEOUT'] ||
      yamlConfig.server?.healthCheck?.timeout?.toString() ||
      '300000',
      10
    ),
    healthCheckInterval: parseInt(
      process.env['LLM_HEALTH_CHECK_INTERVAL'] ||
      yamlConfig.server?.healthCheck?.interval?.toString() ||
      '1000',
      10
    ),
    autoRestart: process.env['LLM_AUTO_RESTART'] === 'true' || yamlConfig.server?.autoRestart || false,
    logLevel: (process.env['LLM_LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') ||
      yamlConfig.server?.logLevel ||
      'info',
    env: {
      PYTHONUNBUFFERED: '1',
      // Set PYTHONPATH to library package directory so Python can find llm_server module
      PYTHONPATH: (() => {
        // If running from ACE (tkr-ace/), point to packages/llm-client/
        // If running standalone, use current directory
        const cwd = process.cwd();
        if (cwd.includes('tkr-ace') && !cwd.includes('llm-client')) {
          return path.join(cwd, 'packages/llm-client');
        }
        return cwd;
      })(),
      LLM_PORT: port.toString(),
      LLM_HOST: host,
      LLM_WORKERS: (process.env['LLM_WORKERS'] || yamlConfig.server?.workers?.toString() || '1'),
      LLM_MODEL_PATH: process.env['LLM_MODEL_PATH'] || yamlConfig.model?.path || './models',
      LLM_MODEL_NAME: process.env['LLM_MODEL_NAME'] || yamlConfig.model?.name || 'gpt-oss-20b',
      LLM_DEVICE: process.env['LLM_DEVICE'] || yamlConfig.model?.device || 'auto',
      LLM_QUANTIZATION: process.env['LLM_QUANTIZATION'] || yamlConfig.model?.quantization || 'int4',
      // Redirect Hugging Face cache to local models directory (must be absolute path)
      HF_HOME: (() => {
        const hfHome = process.env['HF_HOME'] || yamlConfig.huggingface?.home || './models';
        // Convert relative path to absolute
        return path.isAbsolute(hfHome) ? hfHome : path.join(process.cwd(), hfHome);
      })(),
      // Integration settings
      ANTHROPIC_BASE_URL: process.env['ANTHROPIC_BASE_URL'] || yamlConfig.integration?.anthropicBaseUrl || `http://${host}:${port}`,
      ENABLE_CLOUD_FALLBACK: (process.env['ENABLE_CLOUD_FALLBACK'] || yamlConfig.integration?.enableCloudFallback?.toString() || 'false'),
      STREAMING: (process.env['STREAMING'] || yamlConfig.integration?.streaming?.toString() || 'false'),
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
