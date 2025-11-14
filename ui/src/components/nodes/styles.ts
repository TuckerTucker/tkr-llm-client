/**
 * Styling System for ReactFlow Nodes
 *
 * Provides consistent colors, sizes, and state styles for all node types.
 * Uses TailwindCSS classes for styling.
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import type { NodeData, ValidationState } from '../../lib/types/ui-types';

/**
 * Color palette for node types
 */
export const nodeColors = {
  template: {
    default: '#3b82f6', // Blue-500
    hover: '#2563eb', // Blue-600
    selected: '#1d4ed8', // Blue-700
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-900',
  },
  fragment: {
    default: '#10b981', // Green-500
    hover: '#059669', // Green-600
    selected: '#047857', // Green-700
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-900',
  },
  variable: {
    default: '#eab308', // Yellow-500
    hover: '#ca8a04', // Yellow-600
    selected: '#a16207', // Yellow-700
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
  },
  toolConfig: {
    default: '#3b82f6', // Blue-500
    hover: '#2563eb', // Blue-600
    selected: '#1d4ed8', // Blue-700
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-900',
  },
  bundle: {
    default: '#8b5cf6', // Purple-500
    hover: '#7c3aed', // Purple-600
    selected: '#6d28d9', // Purple-700
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    text: 'text-purple-900',
  },
  resolved: {
    default: '#6b7280', // Gray-500
    hover: '#4b5563', // Gray-600
    selected: '#374151', // Gray-700
    bg: 'bg-gray-50',
    border: 'border-gray-500',
    text: 'text-gray-900',
  },
};

/**
 * Node sizes by zoom level
 * Used for semantic zoom - adapts detail based on zoom level
 */
export const nodeSizes = {
  zoom10: { width: 20, height: 20 }, // <10% zoom - tiny square
  zoom25: { width: 50, height: 40 }, // 10-25% - small box
  zoom50: { width: 150, height: 100 }, // 25-75% - compact
  zoom100: { width: 200, height: 150 }, // 75-150% - standard
  zoom200: { width: 300, height: 200 }, // >150% - expanded
};

/**
 * Get node size based on zoom level and node type
 */
export function getNodeSize(
  zoomLevel: number,
  nodeType: NodeData['type']
): { width: number; height: number } {
  // Special sizing for different node types
  const multiplier = {
    template: 1.0,
    fragment: 0.75,
    variable: 0.5,
    toolConfig: 0.8,
    bundle: 0.9,
    resolved: 1.1,
  }[nodeType];

  let baseSize;
  if (zoomLevel < 0.1) {
    baseSize = nodeSizes.zoom10;
  } else if (zoomLevel < 0.5) {
    baseSize = nodeSizes.zoom25;
  } else if (zoomLevel < 1.0) {
    baseSize = nodeSizes.zoom50;
  } else if (zoomLevel < 1.5) {
    baseSize = nodeSizes.zoom100;
  } else {
    baseSize = nodeSizes.zoom200;
  }

  return {
    width: Math.round(baseSize.width * multiplier),
    height: Math.round(baseSize.height * multiplier),
  };
}

/**
 * Border styles for validation states
 */
export const validationBorders = {
  valid: 'border-2 border-green-500',
  error: 'border-2 border-red-500 shadow-red-200',
  warning: 'border-2 border-yellow-500',
  default: 'border border-gray-300',
};

/**
 * Get border classes based on validation state
 */
export function getValidationBorder(validationState?: ValidationState): string {
  if (!validationState) {
    return validationBorders.default;
  }

  if (!validationState.valid) {
    return validationBorders.error;
  }

  if (validationState.warnings.length > 0) {
    return validationBorders.warning;
  }

  return validationBorders.valid;
}

/**
 * Get node classes based on current state
 */
export function getNodeClasses(state: {
  selected?: boolean;
  focused?: boolean;
  validationState?: ValidationState;
  loading?: boolean;
  disabled?: boolean;
}): string {
  const classes: string[] = [
    'transition-all',
    'duration-200',
    'rounded-lg',
    'shadow-md',
  ];

  // Selected state
  if (state.selected) {
    classes.push('ring-2', 'ring-blue-500', 'ring-offset-2');
  }

  // Focused state
  if (state.focused) {
    classes.push('ring-2', 'ring-blue-400');
  }

  // Validation border
  classes.push(getValidationBorder(state.validationState));

  // Loading state
  if (state.loading) {
    classes.push('animate-pulse');
  }

  // Disabled state
  if (state.disabled) {
    classes.push('opacity-50', 'cursor-not-allowed');
  }

  // Hover (if not disabled)
  if (!state.disabled) {
    classes.push('hover:shadow-lg');
  }

  return classes.join(' ');
}

/**
 * Get detail level based on zoom
 */
export type DetailLevel = 'minimal' | 'compact' | 'standard' | 'full';

export function getDetailLevel(zoomLevel: number): DetailLevel {
  if (zoomLevel < 0.5) return 'minimal';
  if (zoomLevel < 1.0) return 'compact';
  if (zoomLevel < 1.5) return 'standard';
  return 'full';
}

/**
 * Icon sizes by detail level
 */
export const iconSizes = {
  minimal: 'w-3 h-3',
  compact: 'w-4 h-4',
  standard: 'w-5 h-5',
  full: 'w-6 h-6',
};

/**
 * Text sizes by detail level
 */
export const textSizes = {
  minimal: 'text-xs',
  compact: 'text-sm',
  standard: 'text-base',
  full: 'text-lg',
};

/**
 * Spacing by detail level
 */
export const spacing = {
  minimal: 'p-1',
  compact: 'p-2',
  standard: 'p-3',
  full: 'p-4',
};

/**
 * Handle styles
 */
export const handleStyles = {
  source: 'w-3 h-3 !bg-white border-2 border-gray-400 hover:border-blue-500',
  target: 'w-3 h-3 !bg-gray-400 border-2 border-gray-600 hover:border-blue-500',
};

/**
 * Edge styles
 */
export const edgeStyles = {
  extends: {
    stroke: '#9333ea', // Purple
    strokeWidth: 3,
    animated: false,
  },
  mixin: {
    stroke: '#10b981', // Green
    strokeWidth: 2,
    strokeDasharray: '5,5',
    animated: true,
  },
  variable: {
    stroke: '#eab308', // Yellow
    strokeWidth: 1,
    strokeDasharray: '2,2',
    animated: false,
  },
  toolRef: {
    stroke: '#3b82f6', // Blue
    strokeWidth: 1,
    animated: false,
  },
  bundle: {
    stroke: '#8b5cf6', // Purple
    strokeWidth: 2,
    animated: false,
  },
  error: {
    stroke: '#ef4444', // Red
    strokeWidth: 3,
    animated: true,
  },
};

/**
 * Helper to combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
