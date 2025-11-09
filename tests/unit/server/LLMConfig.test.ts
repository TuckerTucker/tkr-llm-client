/**
 * Tests for LLM server configuration
 *
 * Tests configuration loading, validation, and error classes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LLMServerConfig,
  DEFAULT_LLM_CONFIG,
  loadLLMConfig,
  validateLLMConfig,
  LLMServerError,
  ServerStartupError,
  HealthCheckError,
  ProcessManagementError,
} from '../../../src/server/LLMConfig';

describe('DEFAULT_LLM_CONFIG', () => {
  it('should have sensible default values', () => {
    expect(DEFAULT_LLM_CONFIG.enabled).toBe(true);
    expect(DEFAULT_LLM_CONFIG.port).toBe(42002);
    expect(DEFAULT_LLM_CONFIG.serverScript).toBe('./llm_server/server.py');
    expect(DEFAULT_LLM_CONFIG.healthCheckTimeout).toBe(300000); // 5 minutes
    expect(DEFAULT_LLM_CONFIG.healthCheckInterval).toBe(1000);
    expect(DEFAULT_LLM_CONFIG.autoRestart).toBe(false);
    expect(DEFAULT_LLM_CONFIG.logLevel).toBe('info');
  });

  it('should not have pythonPath in defaults', () => {
    expect(DEFAULT_LLM_CONFIG.pythonPath).toBeUndefined();
  });
});

describe('loadLLMConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load default configuration', () => {
    const config = loadLLMConfig();

    expect(config.enabled).toBe(true);
    expect(config.port).toBe(42002);
    // YAML config has different scriptPath than old default
    expect(config.serverScript).toBe('./packages/llm-client/llm_server/server.py');
    // YAML config uses 127.0.0.1 instead of localhost
    expect(config.healthCheckUrl).toBe('http://127.0.0.1:42002/health');
    // YAML config has 120000ms timeout instead of 300000ms
    expect(config.healthCheckTimeout).toBe(120000);
    expect(config.healthCheckInterval).toBe(1000);
    expect(config.autoRestart).toBe(false);
    expect(config.logLevel).toBe('info');
  });

  it('should load port from environment', () => {
    process.env['LLM_PORT'] = '3000';
    const config = loadLLMConfig();

    expect(config.port).toBe(3000);
    // YAML config uses 127.0.0.1 as default host
    expect(config.healthCheckUrl).toBe('http://127.0.0.1:3000/health');
  });

  it('should disable when LLM_ENABLED=false', () => {
    process.env['LLM_ENABLED'] = 'false';
    const config = loadLLMConfig();

    expect(config.enabled).toBe(false);
  });

  it('should load Python path from environment', () => {
    process.env['LLM_PYTHON_PATH'] = '/usr/local/bin/python3';
    const config = loadLLMConfig();

    expect(config.pythonPath).toBe('/usr/local/bin/python3');
  });

  it('should load server script from environment', () => {
    process.env['LLM_SERVER_SCRIPT'] = './custom/server.py';
    const config = loadLLMConfig();

    expect(config.serverScript).toBe('./custom/server.py');
  });

  it('should load health check timeout from environment', () => {
    process.env['LLM_HEALTH_CHECK_TIMEOUT'] = '60000';
    const config = loadLLMConfig();

    expect(config.healthCheckTimeout).toBe(60000);
  });

  it('should load health check interval from environment', () => {
    process.env['LLM_HEALTH_CHECK_INTERVAL'] = '2000';
    const config = loadLLMConfig();

    expect(config.healthCheckInterval).toBe(2000);
  });

  it('should enable auto-restart when LLM_AUTO_RESTART=true', () => {
    process.env['LLM_AUTO_RESTART'] = 'true';
    const config = loadLLMConfig();

    expect(config.autoRestart).toBe(true);
  });

  it('should load log level from environment', () => {
    process.env['LLM_LOG_LEVEL'] = 'debug';
    const config = loadLLMConfig();

    expect(config.logLevel).toBe('debug');
  });

  it('should set environment variables for Python process', () => {
    const config = loadLLMConfig();

    expect(config.env.PYTHONUNBUFFERED).toBe('1');
    expect(config.env.PYTHONPATH).toBeDefined();
    expect(config.env.LLM_PORT).toBe('42002');
    expect(config.env.LLM_MODEL_PATH).toBeDefined();
    expect(config.env.LLM_MODEL_NAME).toBeDefined();
    expect(config.env.LLM_DEVICE).toBeDefined();
    expect(config.env.LLM_QUANTIZATION).toBeDefined();
    expect(config.env.HF_HOME).toBeDefined();
  });

  it('should load model configuration from environment', () => {
    process.env['LLM_MODEL_PATH'] = './custom-models';
    process.env['LLM_MODEL_NAME'] = 'custom-model';
    process.env['LLM_DEVICE'] = 'cpu';
    process.env['LLM_QUANTIZATION'] = 'int8';

    const config = loadLLMConfig();

    expect(config.env.LLM_MODEL_PATH).toBe('./custom-models');
    expect(config.env.LLM_MODEL_NAME).toBe('custom-model');
    expect(config.env.LLM_DEVICE).toBe('cpu');
    expect(config.env.LLM_QUANTIZATION).toBe('int8');
  });

  it('should construct health check URL based on port', () => {
    process.env['LLM_PORT'] = '8080';
    const config = loadLLMConfig();

    // YAML config uses 127.0.0.1 as default host
    expect(config.healthCheckUrl).toBe('http://127.0.0.1:8080/health');
  });

  it('should use default values for missing env vars', () => {
    delete process.env['LLM_PORT'];
    delete process.env['LLM_LOG_LEVEL'];
    delete process.env['LLM_AUTO_RESTART'];

    const config = loadLLMConfig();

    expect(config.port).toBe(42002);
    expect(config.logLevel).toBe('info');
    expect(config.autoRestart).toBe(false);
  });

  it('should handle HF_HOME as absolute path', () => {
    process.env['HF_HOME'] = '/absolute/path/to/models';
    const config = loadLLMConfig();

    expect(config.env.HF_HOME).toBe('/absolute/path/to/models');
  });
});

describe('validateLLMConfig', () => {
  const validConfig: LLMServerConfig = {
    enabled: true,
    port: 42002,
    pythonPath: '/usr/bin/python3',
    serverScript: './server.py',
    healthCheckUrl: 'http://localhost:42002/health',
    healthCheckTimeout: 30000,
    healthCheckInterval: 1000,
    autoRestart: false,
    logLevel: 'info',
    env: {},
  };

  it('should validate correct configuration', () => {
    expect(() => validateLLMConfig(validConfig)).not.toThrow();
  });

  it('should skip validation when disabled', () => {
    const config = { ...validConfig, enabled: false, pythonPath: '' };
    expect(() => validateLLMConfig(config)).not.toThrow();
  });

  it('should require pythonPath when enabled', () => {
    const config = { ...validConfig, pythonPath: '' };

    expect(() => validateLLMConfig(config)).toThrow(
      'LLM_PYTHON_PATH required when LLM_ENABLED=true'
    );
  });

  it('should reject port below 1024', () => {
    const config = { ...validConfig, port: 80 };

    expect(() => validateLLMConfig(config)).toThrow(
      'Invalid port: 80. Must be between 1024 and 65535'
    );
  });

  it('should reject port above 65535', () => {
    const config = { ...validConfig, port: 70000 };

    expect(() => validateLLMConfig(config)).toThrow(
      'Invalid port: 70000. Must be between 1024 and 65535'
    );
  });

  it('should accept valid port range', () => {
    const config1 = { ...validConfig, port: 1024 };
    const config2 = { ...validConfig, port: 65535 };
    const config3 = { ...validConfig, port: 8080 };

    expect(() => validateLLMConfig(config1)).not.toThrow();
    expect(() => validateLLMConfig(config2)).not.toThrow();
    expect(() => validateLLMConfig(config3)).not.toThrow();
  });

  it('should reject health check timeout below 1000ms', () => {
    const config = { ...validConfig, healthCheckTimeout: 500 };

    expect(() => validateLLMConfig(config)).toThrow(
      'Health check timeout must be >= 1000ms'
    );
  });

  it('should reject health check interval below 100ms', () => {
    const config = { ...validConfig, healthCheckInterval: 50 };

    expect(() => validateLLMConfig(config)).toThrow(
      'Health check interval must be >= 100ms'
    );
  });

  it('should reject interval greater than timeout', () => {
    const config = {
      ...validConfig,
      healthCheckTimeout: 5000,
      healthCheckInterval: 10000,
    };

    expect(() => validateLLMConfig(config)).toThrow(
      'Health check interval cannot exceed timeout'
    );
  });

  it('should accept interval equal to timeout', () => {
    const config = {
      ...validConfig,
      healthCheckTimeout: 5000,
      healthCheckInterval: 5000,
    };

    expect(() => validateLLMConfig(config)).not.toThrow();
  });
});

describe('LLMServerError', () => {
  it('should create error with message', () => {
    const error = new LLMServerError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('LLMServerError');
  });

  it('should support cause chaining', () => {
    const cause = new Error('Root cause');
    const error = new LLMServerError('Wrapper', cause);

    expect(error.cause).toBe(cause);
  });

  it('should maintain prototype chain', () => {
    const error = new LLMServerError('Test');

    expect(error).toBeInstanceOf(LLMServerError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('ServerStartupError', () => {
  it('should extend LLMServerError', () => {
    const error = new ServerStartupError('Startup failed');

    expect(error).toBeInstanceOf(ServerStartupError);
    expect(error).toBeInstanceOf(LLMServerError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ServerStartupError');
  });

  it('should support cause chaining', () => {
    const cause = new Error('Port in use');
    const error = new ServerStartupError('Failed to start', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('HealthCheckError', () => {
  it('should store attempts count', () => {
    const error = new HealthCheckError('Health check failed', 5);

    expect(error.attempts).toBe(5);
    expect(error.message).toBe('Health check failed');
    expect(error.name).toBe('HealthCheckError');
  });

  it('should extend LLMServerError', () => {
    const error = new HealthCheckError('Failed', 3);

    expect(error).toBeInstanceOf(HealthCheckError);
    expect(error).toBeInstanceOf(LLMServerError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should support cause chaining', () => {
    const cause = new Error('Connection refused');
    const error = new HealthCheckError('Health check failed', 10, cause);

    expect(error.cause).toBe(cause);
    expect(error.attempts).toBe(10);
  });
});

describe('ProcessManagementError', () => {
  it('should extend LLMServerError', () => {
    const error = new ProcessManagementError('Process died');

    expect(error).toBeInstanceOf(ProcessManagementError);
    expect(error).toBeInstanceOf(LLMServerError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ProcessManagementError');
  });

  it('should support cause chaining', () => {
    const cause = new Error('SIGKILL');
    const error = new ProcessManagementError('Process terminated', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('Error hierarchy', () => {
  it('should allow type discrimination', () => {
    const errors: LLMServerError[] = [
      new ServerStartupError('startup'),
      new HealthCheckError('health', 5),
      new ProcessManagementError('process'),
    ];

    errors.forEach(error => {
      expect(error).toBeInstanceOf(LLMServerError);
      expect(error).toBeInstanceOf(Error);
    });

    // Type discrimination
    const healthError = errors[1];
    if (healthError instanceof HealthCheckError) {
      expect(healthError.attempts).toBe(5);
    } else {
      throw new Error('Type discrimination failed');
    }
  });
});
