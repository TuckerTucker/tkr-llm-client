/**
 * VariableNode Component
 *
 * Diamond-shaped node with yellow tint (100x80px default) representing a template variable.
 *
 * Features:
 * - Shows: variable name, type, value
 * - Input field for value editing
 * - Validation feedback (red border if invalid)
 * - Output handle (connects to templates)
 * - Diamond shape for visual distinction
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React, { useState, useCallback } from 'react';
import type { BaseNodeProps, VariableNodeData } from '../../lib/types/ui-types';
import { nodeColors, getDetailLevel, cn } from './styles';
import NodeHandle from './NodeHandle';
import { Position } from 'reactflow';

export interface VariableNodeProps extends BaseNodeProps<VariableNodeData> {
  onValueChange?: (value: any) => void;
}

/**
 * Variable Node Component
 *
 * Visual specification:
 *       ╱────────────────╲
 *      ╱  targetFile      ╲
 *     │  Type: string      │
 *     │  [src/index.ts  ]  │ ← Editable input
 *      ╲  ✓ Valid        ╱
 *       ╲────────────────╱
 *                      ○
 *                 (output)
 */
export const VariableNode: React.FC<VariableNodeProps> = ({
  id,
  data,
  selected,
  dragging,
  zoomLevel = 1.5, // Default to 'full' detail level
  onValueChange,
}) => {
  const [localValue, setLocalValue] = useState(data.value);
  const [isValid, setIsValid] = useState(true);
  const detailLevel = getDetailLevel(zoomLevel);
  const colors = nodeColors.variable;

  // Validate value
  const validateValue = useCallback((value: any): boolean => {
    if (data.required && (value === null || value === undefined || value === '')) {
      return false;
    }

    // Type-specific validation
    switch (data.variableType) {
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      case 'enum':
        return data.enumOptions?.includes(value) ?? false;
      default:
        return true;
    }
  }, [data.required, data.variableType, data.enumOptions]);

  // Handle value change
  const handleValueChange = useCallback((newValue: any) => {
    setLocalValue(newValue);
    const valid = validateValue(newValue);
    setIsValid(valid);
    if (valid && onValueChange) {
      onValueChange(newValue);
    }
  }, [validateValue, onValueChange]);

  // Render input based on variable type
  const renderInput = () => {
    const inputClasses = cn(
      'w-full px-2 py-1 text-sm border rounded',
      isValid ? 'border-gray-300' : 'border-red-500',
      'focus:outline-none focus:ring-2 focus:ring-yellow-500'
    );

    switch (data.variableType) {
      case 'boolean':
        return (
          <select
            value={String(localValue)}
            onChange={(e) => handleValueChange(e.target.value === 'true')}
            className={inputClasses}
            aria-label={`${data.variableName} value`}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case 'enum':
        return (
          <select
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className={inputClasses}
            aria-label={`${data.variableName} value`}
          >
            <option value="">Select...</option>
            {data.enumOptions?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className={inputClasses}
            placeholder={data.defaultValue !== undefined ? String(data.defaultValue) : 'Enter number...'}
            aria-label={`${data.variableName} value`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className={inputClasses}
            placeholder={data.defaultValue || 'Enter value...'}
            aria-label={`${data.variableName} value`}
          />
        );
    }
  };

  // Diamond shape using CSS transform
  const diamondContainer = (content: React.ReactNode) => (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center',
        'transition-all duration-200'
      )}
    >
      {/* Diamond background */}
      <div
        className={cn(
          'absolute inset-0',
          'transform rotate-45',
          colors.bg,
          isValid ? colors.border : 'border-red-500',
          'border-2',
          selected ? 'ring-2 ring-yellow-500 ring-offset-2' : '',
          'shadow-md',
          !isValid && 'shadow-red-200'
        )}
      />

      {/* Content (not rotated) */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        {content}
      </div>

      {/* Handles */}
      <NodeHandle
        type="source"
        position={Position.Right}
        id="variable-output"
        title="Connect to template"
      />
    </div>
  );

  // Content based on detail level
  const content = (() => {
    switch (detailLevel) {
      case 'minimal':
        return (
          <div className="text-center">
            <span className="text-lg">🔤</span>
          </div>
        );

      case 'compact':
        return (
          <div className="text-center space-y-1">
            <div className="font-semibold text-xs truncate">{data.variableName}</div>
            <div className="text-xs text-gray-600">{data.variableType}</div>
          </div>
        );

      case 'standard':
      case 'full':
        return (
          <div className="w-full space-y-2">
            {/* Variable name */}
            <div className="text-center">
              <div className="font-semibold text-sm truncate" title={data.variableName}>
                {data.variableName}
              </div>
              <div className="text-xs text-gray-600">
                Type: {data.variableType}
                {data.required && <span className="text-red-500 ml-1">*</span>}
              </div>
            </div>

            {/* Input field (only in standard and full) */}
            {detailLevel !== 'compact' && renderInput()}

            {/* Validation status */}
            <div className="text-center text-xs">
              {isValid ? (
                <span className="text-green-600">✓ Valid</span>
              ) : (
                <span className="text-red-600">✗ Invalid</span>
              )}
            </div>
          </div>
        );
    }
  })();

  return (
    <div
      className="variable-node"
      style={{
        width: detailLevel === 'minimal' ? 40 : detailLevel === 'compact' ? 100 : 120,
        height: detailLevel === 'minimal' ? 40 : detailLevel === 'compact' ? 80 : 120,
      }}
      role="article"
      tabIndex={0}
      aria-label={`Variable: ${data.variableName}. Type: ${data.variableType}. ${data.required ? 'Required' : 'Optional'}. ${isValid ? 'Valid' : 'Invalid'}`}
    >
      {diamondContainer(content)}
    </div>
  );
};

export default VariableNode;
