/**
 * Integration tests for LLMServerManager
 *
 * Tests process lifecycle management with mocked child_process
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import {
  LLMServerManager,
  ServerState,
} from '../../src/server/LLMServerManager';
import { LLMServerConfig } from '../../src/server/LLMConfig';

// Mock child_process
const mockSpawn = vi.fn();
vi.mock('child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}));

// Mock fetch for health checks
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('LLMServerManager', () => {
  let manager: LLMServerManager;
  let config: LLMServerConfig;
  let mockProcess: any;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      enabled: true,
      port: 42002,
      pythonPath: '/usr/bin/python3',
      serverScript: './llm_server/server.py',
      healthCheckUrl: 'http://localhost:42002/health',
      healthCheckTimeout: 5000,
      healthCheckInterval: 100,
      autoRestart: false,
      logLevel: 'info',
      env: {},
    };

    // Create mock process
    mockProcess = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.kill = vi.fn();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    mockSpawn.mockReturnValue(mockProcess);
  });

  afterEach(() => {
    if (manager) {
      try {
        manager.removeAllListeners();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('constructor', () => {
    it('should create manager with valid config', () => {
      manager = new LLMServerManager(config);

      expect(manager.state).toBe(ServerState.STOPPED);
      expect(manager.process).toBeNull();
      expect(manager.config).toEqual(config);
    });

    it('should validate config on construction', () => {
      const invalidConfig = { ...config, pythonPath: '' };

      expect(() => new LLMServerManager(invalidConfig)).toThrow(
        'LLM_PYTHON_PATH required'
      );
    });

    it('should reject invalid port', () => {
      const invalidConfig = { ...config, port: 80 };

      expect(() => new LLMServerManager(invalidConfig)).toThrow(
        'Invalid port'
      );
    });
  });

  describe('start', () => {
    beforeEach(() => {
      manager = new LLMServerManager(config);
    });

    it('should spawn Python process', async () => {
      // Mock healthy server
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          model_loaded: true,
        }),
      });

      const startPromise = manager.start();

      // Wait a bit for spawn to be called
      await new Promise(resolve => setTimeout(resolve, 10));

      // Simulate process startup
      mockProcess.emit('spawn');

      await startPromise;

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining('python'),
        expect.arrayContaining([expect.stringContaining('server.py')]),
        expect.objectContaining({ env: expect.any(Object) })
      );
    });

    it('should change state to STARTING then HEALTHY', async () => {
      const states: ServerState[] = [];

      manager.on('state-change', (state) => {
        states.push(state);
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ok',
          model_loaded: true,
        }),
      });

      const startPromise = manager.start();

      await new Promise(resolve => setTimeout(resolve, 10));
      mockProcess.emit('spawn');

      await startPromise;

      expect(states).toContain(ServerState.STARTING);
      expect(states).toContain(ServerState.HEALTHY);
    });

    it('should throw if already starting', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      manager.start(); // Don't await

      await expect(manager.start()).rejects.toThrow(
        'Cannot start server'
      );
    });

    it('should emit started event when healthy', async () => {
      const startedHandler = vi.fn();
      manager.on('started', startedHandler);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const startPromise = manager.start();
      await new Promise(resolve => setTimeout(resolve, 10));
      mockProcess.emit('spawn');
      await startPromise;

      expect(startedHandler).toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    beforeEach(() => {
      manager = new LLMServerManager(config);
    });

    it('should have initial state STOPPED', () => {
      expect(manager.state).toBe(ServerState.STOPPED);
    });

    it('should emit state-change events', async () => {
      const stateChanges: ServerState[] = [];

      manager.on('state-change', (state) => {
        stateChanges.push(state);
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });

      const startPromise = manager.start();
      await new Promise(resolve => setTimeout(resolve, 10));
      mockProcess.emit('spawn');
      await startPromise;

      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges).toContain(ServerState.STARTING);
    });
  });

  describe('event forwarding', () => {
    beforeEach(() => {
      manager = new LLMServerManager(config);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', model_loaded: true }),
      });
    });

    it('should forward stdout events', async () => {
      const stdoutHandler = vi.fn();
      manager.on('stdout', stdoutHandler);

      const startPromise = manager.start();
      await new Promise(resolve => setTimeout(resolve, 10));

      mockProcess.stdout.emit('data', Buffer.from('Server started'));
      mockProcess.emit('spawn');

      await startPromise;

      expect(stdoutHandler).toHaveBeenCalledWith(
        expect.stringContaining('Server started')
      );
    });

    it('should forward stderr events', async () => {
      const stderrHandler = vi.fn();
      manager.on('stderr', stderrHandler);

      const startPromise = manager.start();
      await new Promise(resolve => setTimeout(resolve, 10));

      mockProcess.stderr.emit('data', Buffer.from('Warning message'));
      mockProcess.emit('spawn');

      await startPromise;

      expect(stderrHandler).toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
    });
  });

  describe('configuration', () => {
    it('should store configuration', () => {
      manager = new LLMServerManager(config);

      expect(manager.config).toEqual(config);
      expect(manager.config.port).toBe(42002);
      expect(manager.config.pythonPath).toBe('/usr/bin/python3');
    });

    it('should make config readonly', () => {
      manager = new LLMServerManager(config);

      expect(() => {
        (manager as any).config = {};
      }).toThrow();
    });
  });
});
