/**
 * Generic LLM Client Types
 *
 * Framework-agnostic types for LLM interaction
 */

/**
 * Query options for LLM requests
 */
export interface LLMQueryOptions {
  /**
   * System prompt to set context for the LLM
   */
  systemPrompt?: string;

  /**
   * List of allowed tools the LLM can use
   * Examples: ['Read', 'Write', 'Bash', 'Grep', 'Glob']
   */
  allowedTools?: string[];

  /**
   * Maximum number of conversation turns
   * @default 1
   */
  maxTurns?: number;

  /**
   * Maximum number of messages to process
   * @default 100
   */
  maxMessages?: number;

  /**
   * Query timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Session identifier for conversation continuity
   */
  sessionId?: string;

  /**
   * MCP server configuration
   */
  mcpConfig?: string;

  /**
   * Temperature for LLM sampling (0.0-1.0)
   * - Low (≤0.3): Factual, deterministic
   * - Medium (0.4-0.7): Balanced
   * - High (≥0.8): Creative, diverse
   * @default 0.7
   */
  temperature?: number;

  /**
   * Permission mode for tool execution
   * - 'default': Ask for permission
   * - 'acceptEdits': Auto-accept edits
   * - 'bypassPermissions': Autonomous execution
   * - 'plan': Planning mode
   * @default 'default'
   */
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';

  /**
   * Optional context string for thinking attribution
   * Examples: 'aspirational', 'task-123', 'analysis'
   */
  context?: string;
}

/**
 * Generic LLM message format
 *
 * Compatible with both Claude SDK and local LLM responses
 */
export interface LLMMessage {
  /**
   * Message type
   */
  type: 'text' | 'tool_use' | 'tool_result' | 'result' | 'error';

  /**
   * Message subtype (for result messages)
   */
  subtype?: 'success' | 'error' | 'abort';

  /**
   * Message role
   */
  role?: 'user' | 'assistant';

  /**
   * Text content
   */
  content?: string;

  /**
   * Alternative text field (SDK compatibility)
   */
  text?: string;

  /**
   * Result content (for result messages)
   */
  result?: string;

  /**
   * Tool name (for tool_use messages)
   */
  name?: string;

  /**
   * Tool input (for tool_use messages)
   */
  input?: any;

  /**
   * Extracted thinking blocks
   */
  thinking?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Subagent execution result
 */
export interface SubagentResult {
  /**
   * Whether the subagent succeeded
   */
  success: boolean;

  /**
   * Output from the subagent
   */
  output: string;

  /**
   * Additional metadata
   */
  metadata?: any;
}

/**
 * Configuration for LLM client
 */
export interface LLMClientConfig {
  /**
   * Claude SDK configuration
   */
  claudeSDK?: {
    /**
     * Base URL for Claude API
     * @default 'http://127.0.0.1:42002' (local server)
     */
    baseUrl?: string;

    /**
     * API key for Claude cloud API (fallback)
     */
    apiKey?: string;

    /**
     * Enable fallback to cloud API if local server fails
     * @default false
     */
    enableFallback?: boolean;
  };

  /**
   * Local LLM server configuration
   */
  localServer?: {
    /**
     * Enable local LLM server
     * @default true
     */
    enabled: boolean;

    /**
     * Port for local server
     * @default 42002
     */
    port: number;

    /**
     * Path to Python interpreter
     */
    pythonPath?: string;

    /**
     * Path to server script
     */
    serverScript?: string;

    /**
     * Model name to use
     * @default 'gpt-oss-20b'
     */
    modelName?: string;

    /**
     * Model path/directory
     * @default './models'
     */
    modelPath?: string;
  };

  /**
   * Default query options
   */
  defaults?: {
    /**
     * Default max messages
     * @default 100
     */
    maxMessages: number;

    /**
     * Default max turns
     * @default 1
     */
    maxTurns: number;

    /**
     * Default query timeout (ms)
     * @default 30000
     */
    queryTimeout: number;
  };
}
