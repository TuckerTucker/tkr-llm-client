/**
 * @tkr/llm-client
 *
 * Generic LLM client library with Claude SDK and local LLM server support
 * Framework-agnostic, reusable in any TypeScript project
 */

// Client exports
export { ILLMClient, ILLMEventEmitter } from './client/interfaces';
export {
  LLMMessage,
  LLMQueryOptions,
  LLMClientConfig
} from './client/types';
export { ClaudeSDKClient } from './client/ClaudeSDKClient';
export { LocalLLMClient } from './client/LocalLLMClient';
export { LLMClient } from './client/LLMClient';

// Server management exports
export {
  LLMServerManager,
  ILLMServerManager,
  ServerState,
  ServerEvents,
  LLMServerConfig,
  DEFAULT_LLM_CONFIG,
  loadLLMConfig,
  validateLLMConfig,
  LLMServerError,
  ServerStartupError,
  HealthCheckError,
  ProcessManagementError,
  HealthCheckResult,
  checkHealth,
  waitForHealthy,
  waitForHealthyWithProgress
} from './server';

// Utility exports
export { ThinkingBlock } from './utils/types';
export {
  extractThinkingBlocks,
  hasThinkingBlocks,
  stripThinkingBlocks,
  getFirstThinkingBlock
} from './utils/thinking';
export {
  collectMessages,
  extractTextContent,
  filterMessages,
  takeMessages,
  mapMessages
} from './utils/streaming';
export {
  RetryOptions,
  withRetry,
  isNetworkError,
  isRateLimitError,
  isRetryableError
} from './utils/retry';

// Error exports
export {
  LLMClientError,
  QueryError,
  QueryTimeoutError,
  ServerUnavailableError,
  ConfigurationError
} from './errors';
