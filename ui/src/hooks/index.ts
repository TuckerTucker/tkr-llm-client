/**
 * Hooks Index
 *
 * Re-exports all custom React hooks for easy importing.
 *
 * @module ui/hooks
 * @version 1.0.0
 * @author State Management Integration Engineer (Agent 4, Wave 1)
 */

export {
  useCanvas,
  useCanvasHistory,
  useCanvasSelection,
  useCanvasViewport,
} from './useCanvas';

export { useAutoLayout } from './useAutoLayout';
export { useLayoutSelector, getLayoutMetadata, LAYOUT_OPTIONS } from './useLayoutSelector';
export { useVariables } from './useVariables';
export { useModes } from './useModes';
export { useDragAndDrop, useDraggableTemplate } from './useDragAndDrop';
export { useNodeSelection } from './useNodeSelection';
export { useZoomLevel, useDetailLevel, calculateDetailLevel } from './useZoomLevel';
export { useExport, ExportFormatEnum } from './useExport';

export type {
  LayoutAlgorithmType,
  UseLayoutConfig,
  LayoutResultInfo,
  LayoutError,
} from './useAutoLayout';

export type { LayoutSelectorConfig, LayoutMetadata } from './useLayoutSelector';
export type { UseVariablesReturn } from './useVariables';
export type { UseModesReturn } from './useModes';
export type { AgentTemplate } from './useDragAndDrop';
