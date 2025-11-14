/**
 * Panel Types and Interfaces
 *
 * Defines types for panel content, modes, and communication.
 *
 * @module components/panels/types
 * @version 1.0.0
 * @author Panel Content Engineer (Agent 5)
 */

import type { AgentTemplate, PromptFragment, ToolConfig } from '../../templates/types';
import type { EnhancedValidationResult } from '../../lib/validation';

// ============================================================================
// UI MODE TYPES
// ============================================================================

/**
 * UI mode for the template editor.
 *
 * Determines which left panel content to display and what operations
 * are available.
 */
export type UIMode = 'explorer' | 'composition' | 'execution' | 'validation';

// ============================================================================
// PANEL CONTEXT TYPES
// ============================================================================

/**
 * Context for panel communication and state.
 */
export interface PanelContextType {
  /** Current UI mode */
  mode: UIMode;

  /** Set the UI mode */
  setMode: (mode: UIMode) => void;

  /** Currently selected node ID */
  selectedNodeId: string | null;

  /** Set selected node ID */
  setSelectedNodeId: (id: string | null) => void;

  /** Active bottom panel tab */
  activeBottomTab: BottomPanelTab;

  /** Set active bottom panel tab */
  setActiveBottomTab: (tab: BottomPanelTab) => void;

  /** Validation results for all nodes */
  validationResults: Map<string, EnhancedValidationResult>;

  /** Set validation results */
  setValidationResults: (results: Map<string, EnhancedValidationResult>) => void;

  /** Execution output (if any) */
  executionOutput: string | null;

  /** Set execution output */
  setExecutionOutput: (output: string | null) => void;

  /** Console messages */
  consoleMessages: ConsoleMessage[];

  /** Add console message */
  addConsoleMessage: (message: ConsoleMessage) => void;

  /** Clear console */
  clearConsole: () => void;
}

// ============================================================================
// BOTTOM PANEL TAB TYPES
// ============================================================================

/**
 * Bottom panel tab identifier.
 */
export type BottomPanelTab = 'validation' | 'preview' | 'output' | 'console';

// ============================================================================
// CATALOG TYPES
// ============================================================================

/**
 * Template catalog item for display in left panel.
 */
export interface CatalogItem {
  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template tags */
  tags: string[];

  /** Template version */
  version: string;

  /** Template author */
  author?: string;

  /** Full template data */
  template: AgentTemplate;

  /** File path */
  path: string;
}

/**
 * Catalog filters.
 */
export interface CatalogFilters {
  /** Search query */
  search: string;

  /** Filter by tags */
  tags: string[];

  /** Filter by tool usage */
  tools: string[];
}

// ============================================================================
// COMPONENT LIBRARY TYPES
// ============================================================================

/**
 * Component library item (fragment, config, or bundle).
 */
export type LibraryItem =
  | { type: 'fragment'; data: PromptFragment; name: string }
  | { type: 'config'; data: ToolConfig; name: string }
  | { type: 'bundle'; data: LibraryBundle; name: string };

/**
 * Bundle of related components.
 */
export interface LibraryBundle {
  /** Bundle name */
  name: string;

  /** Bundle description */
  description: string;

  /** Fragments in bundle */
  fragments: PromptFragment[];

  /** Configs in bundle */
  configs: ToolConfig[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation error for display.
 */
export interface ValidationErrorDisplay {
  /** Node ID */
  nodeId: string;

  /** Node name */
  nodeName: string;

  /** Field that failed */
  field: string;

  /** Error message */
  message: string;

  /** Severity */
  severity: 'error' | 'warning' | 'info';

  /** Can be fixed automatically */
  fixable: boolean;
}

// ============================================================================
// CONSOLE TYPES
// ============================================================================

/**
 * Console message type.
 */
export type ConsoleMessageType = 'info' | 'warning' | 'error' | 'success' | 'debug';

/**
 * Console message.
 */
export interface ConsoleMessage {
  /** Unique ID */
  id: string;

  /** Message type */
  type: ConsoleMessageType;

  /** Message text */
  message: string;

  /** Timestamp */
  timestamp: number;

  /** Additional details */
  details?: string;

  /** Source of message */
  source?: string;
}

// ============================================================================
// PREVIEW TYPES
// ============================================================================

/**
 * Preview display data.
 */
export interface PreviewDisplay {
  /** Interpolated prompt */
  prompt: string;

  /** Resolved config (JSON) */
  config: string;

  /** Token count estimate */
  tokenCount: number;

  /** Variables used */
  variables: Record<string, any>;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports UIMode - UI mode type
 * @exports PanelContextType - Panel context interface
 * @exports BottomPanelTab - Bottom panel tab type
 * @exports CatalogItem - Catalog item interface
 * @exports CatalogFilters - Catalog filters interface
 * @exports LibraryItem - Library item type
 * @exports LibraryBundle - Library bundle interface
 * @exports ValidationErrorDisplay - Validation error display interface
 * @exports ConsoleMessage - Console message interface
 * @exports ConsoleMessageType - Console message type
 * @exports PreviewDisplay - Preview display interface
 */
