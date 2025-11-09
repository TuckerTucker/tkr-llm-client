/**
 * LLM Server Manager
 *
 * Manages lifecycle of the local LLM FastAPI server process.
 * Handles spawning, monitoring, health checks, and graceful shutdown.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import {
  LLMServerConfig,
  validateLLMConfig,
  ServerStartupError,
  ProcessManagementError,
} from './LLMConfig';
import {
  HealthCheckResult,
  waitForHealthyWithProgress,
  checkHealth,
} from './LLMHealthCheck';

/**
 * Server lifecycle states
 */
export enum ServerState {
  STOPPED = 'stopped',
  STARTING = 'starting',
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  STOPPING = 'stopping',
  ERROR = 'error',
}

/**
 * Server lifecycle events
 */
export interface ServerEvents {
  'state-change': (state: ServerState) => void;
  'stdout': (data: string) => void;
  'stderr': (data: string) => void;
  'error': (error: Error) => void;
  'started': () => void;
  'stopped': () => void;
}

/**
 * Manages lifecycle of local LLM server process
 */
export interface ILLMServerManager {
  /**
   * Current server state
   */
  readonly state: ServerState;

  /**
   * Server process (null if not running)
   */
  readonly process: ChildProcess | null;

  /**
   * Server configuration
   */
  readonly config: LLMServerConfig;

  /**
   * Start the LLM server
   * @throws Error if server fails to start
   */
  start(): Promise<void>;

  /**
   * Stop the LLM server gracefully
   * @param timeout Maximum time to wait for graceful shutdown (ms)
   */
  stop(timeout?: number): Promise<void>;

  /**
   * Check if server is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get current health status
   */
  getHealth(): Promise<HealthCheckResult>;

  /**
   * Restart the server
   */
  restart(): Promise<void>;

  /**
   * Register event listener
   */
  on<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]): this;

  /**
   * Unregister event listener
   */
  off<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]): this;
}

/**
 * LLM Server Manager Implementation
 */
export class LLMServerManager extends EventEmitter implements ILLMServerManager {
  private _state: ServerState = ServerState.STOPPED;
  private _process: ChildProcess | null = null;
  private _config: LLMServerConfig;

  constructor(config: LLMServerConfig) {
    super();
    this._config = config;

    // Validate configuration
    validateLLMConfig(config);
  }

  get state(): ServerState {
    return this._state;
  }

  get process(): ChildProcess | null {
    return this._process;
  }

  get config(): LLMServerConfig {
    return this._config;
  }

  /**
   * Start the LLM server
   */
  async start(): Promise<void> {
    if (this._state !== ServerState.STOPPED) {
      throw new ProcessManagementError(
        `Cannot start server in state: ${this._state}`
      );
    }

    this.setState(ServerState.STARTING);

    try {
      // Resolve server script path relative to project root
      const projectRoot = process.cwd();
      const serverScriptPath = path.resolve(projectRoot, this._config.serverScript);

      this.log('info', `Starting LLM server: ${this._config.pythonPath} ${serverScriptPath}`);
      this.log('info', `Health check URL: ${this._config.healthCheckUrl}`);

      // Spawn Python process
      this._process = spawn(
        this._config.pythonPath,
        [serverScriptPath],
        {
          cwd: projectRoot,
          env: {
            ...process.env,
            ...this._config.env,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );

      // Setup process event handlers
      this.setupProcessHandlers();

      // Wait for server to become healthy
      const maxAttempts = Math.ceil(
        this._config.healthCheckTimeout / this._config.healthCheckInterval
      );

      this.log('info', `Waiting for server to become healthy (max ${maxAttempts} attempts)...`);

      await waitForHealthyWithProgress(
        this._config.healthCheckUrl,
        maxAttempts,
        this._config.healthCheckInterval,
        (attempt, max, error) => {
          if (this._config.logLevel === 'debug') {
            this.log('debug', `Health check attempt ${attempt}/${max}${error ? `: ${error.message}` : ''}`);
          }
        }
      );

      this.setState(ServerState.HEALTHY);
      this.log('info', '✅ LLM server is healthy and ready');
      this.emit('started');

    } catch (error) {
      this.setState(ServerState.ERROR);

      // Clean up process if it's still running
      if (this._process) {
        this._process.kill('SIGKILL');
        this._process = null;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new ServerStartupError(
        `Failed to start LLM server: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Stop the LLM server gracefully
   */
  async stop(timeout: number = 5000): Promise<void> {
    if (this._state === ServerState.STOPPED || this._state === ServerState.STOPPING) {
      return;
    }

    if (!this._process) {
      this.setState(ServerState.STOPPED);
      return;
    }

    this.setState(ServerState.STOPPING);
    this.log('info', 'Stopping LLM server...');

    try {
      await this.shutdownProcess(this._process, timeout);
      this.log('info', '✅ LLM server stopped gracefully');
    } catch (error) {
      this.log('error', `Error during shutdown: ${error}`);
    } finally {
      this._process = null;
      this.setState(ServerState.STOPPED);
      this.emit('stopped');
    }
  }

  /**
   * Check if server is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (this._state !== ServerState.HEALTHY) {
      return false;
    }

    try {
      const result = await checkHealth(this._config.healthCheckUrl, 5000);
      return result.healthy;
    } catch {
      return false;
    }
  }

  /**
   * Get current health status
   */
  async getHealth(): Promise<HealthCheckResult> {
    return checkHealth(this._config.healthCheckUrl, 5000);
  }

  /**
   * Restart the server
   */
  async restart(): Promise<void> {
    this.log('info', 'Restarting LLM server...');
    await this.stop();
    await this.start();
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    if (!this._process) {
      return;
    }

    // Handle stdout
    this._process.stdout?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      this.log('debug', `[stdout] ${message}`);
      this.emit('stdout', message);
    });

    // Handle stderr
    this._process.stderr?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      this.log('warn', `[stderr] ${message}`);
      this.emit('stderr', message);
    });

    // Handle process errors
    this._process.on('error', (error: Error) => {
      this.log('error', `Process error: ${error.message}`);
      this.setState(ServerState.ERROR);
      this.emit('error', error);
    });

    // Handle process exit
    this._process.on('exit', (code: number | null, signal: string | null) => {
      const exitInfo = signal ? `signal ${signal}` : `code ${code}`;
      this.log('info', `Process exited with ${exitInfo}`);

      if (this._state !== ServerState.STOPPING) {
        // Unexpected exit
        this.setState(ServerState.ERROR);

        if (this._config.autoRestart && code !== 0) {
          this.log('info', 'Auto-restarting server...');
          this.restart().catch(error => {
            this.log('error', `Auto-restart failed: ${error}`);
          });
        }
      }
    });
  }

  /**
   * Gracefully shutdown process
   */
  private async shutdownProcess(proc: ChildProcess, timeout: number): Promise<void> {
    return new Promise<void>((resolve) => {
      let timeoutHandle: NodeJS.Timeout;

      const onExit = () => {
        clearTimeout(timeoutHandle);
        resolve();
      };

      proc.once('exit', onExit);

      // Send SIGTERM for graceful shutdown
      proc.kill('SIGTERM');

      // Force kill after timeout
      timeoutHandle = setTimeout(() => {
        proc.off('exit', onExit);
        proc.kill('SIGKILL');
        this.log('warn', 'Forced shutdown with SIGKILL');
        resolve();
      }, timeout);
    });
  }

  /**
   * Update server state and emit event
   */
  private setState(newState: ServerState): void {
    if (this._state !== newState) {
      this._state = newState;
      this.emit('state-change', newState);
    }
  }

  /**
   * Log message based on configured log level
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this._config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const prefix = '[LLM Server]';
      switch (level) {
        case 'debug':
          console.debug(`${prefix} ${message}`);
          break;
        case 'info':
          console.log(`${prefix} ${message}`);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`);
          break;
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
      }
    }
  }

  /**
   * Type-safe event listener registration
   */
  override on<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]): this {
    super.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  /**
   * Type-safe event listener removal
   */
  override off<K extends keyof ServerEvents>(event: K, listener: ServerEvents[K]): this {
    super.off(event, listener as (...args: unknown[]) => void);
    return this;
  }
}
