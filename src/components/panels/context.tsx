/**
 * Panel Context and Hook
 *
 * Provides context for panel communication and state management.
 *
 * @module components/panels/context
 * @version 1.0.0
 * @author Panel Content Engineer (Agent 5)
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  PanelContextType,
  UIMode,
  BottomPanelTab,
  ConsoleMessage,
} from './types';
import type { EnhancedValidationResult } from '../../lib/validation';

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const PanelContext = createContext<PanelContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Props for PanelProvider.
 */
export interface PanelProviderProps {
  /** Child components */
  children: React.ReactNode;

  /** Initial mode (defaults to 'explorer') */
  initialMode?: UIMode;

  /** Initial bottom tab (defaults to 'validation') */
  initialBottomTab?: BottomPanelTab;
}

/**
 * Panel context provider component.
 *
 * Wraps the application to provide panel state and communication.
 *
 * @example
 * ```tsx
 * <PanelProvider initialMode="explorer">
 *   <App />
 * </PanelProvider>
 * ```
 */
export function PanelProvider({
  children,
  initialMode = 'explorer',
  initialBottomTab = 'validation',
}: PanelProviderProps): JSX.Element {
  // State
  const [mode, setMode] = useState<UIMode>(initialMode);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomPanelTab>(initialBottomTab);
  const [validationResults, setValidationResults] = useState<
    Map<string, EnhancedValidationResult>
  >(new Map());
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);

  // Console operations
  const addConsoleMessage = useCallback((message: ConsoleMessage) => {
    setConsoleMessages((prev) => [...prev, message]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleMessages([]);
  }, []);

  // Memoize context value
  const contextValue = useMemo<PanelContextType>(
    () => ({
      mode,
      setMode,
      selectedNodeId,
      setSelectedNodeId,
      activeBottomTab,
      setActiveBottomTab,
      validationResults,
      setValidationResults,
      executionOutput,
      setExecutionOutput,
      consoleMessages,
      addConsoleMessage,
      clearConsole,
    }),
    [
      mode,
      selectedNodeId,
      activeBottomTab,
      validationResults,
      executionOutput,
      consoleMessages,
      addConsoleMessage,
      clearConsole,
    ]
  );

  return <PanelContext.Provider value={contextValue}>{children}</PanelContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access panel context.
 *
 * Must be used within a PanelProvider.
 *
 * @returns Panel context
 * @throws {Error} If used outside PanelProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, setMode, selectedNodeId } = usePanelContext();
 *
 *   return (
 *     <div>
 *       <p>Current mode: {mode}</p>
 *       <button onClick={() => setMode('explorer')}>
 *         Switch to Explorer
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePanelContext(): PanelContextType {
  const context = useContext(PanelContext);

  if (!context) {
    throw new Error('usePanelContext must be used within a PanelProvider');
  }

  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * @public
 * @exports PanelProvider - Panel context provider component
 * @exports usePanelContext - Hook to access panel context
 * @exports PanelProviderProps - Props for PanelProvider
 */
