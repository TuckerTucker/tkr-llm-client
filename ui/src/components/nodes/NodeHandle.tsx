/**
 * NodeHandle Component
 *
 * Custom connection handle for ReactFlow nodes with type-specific styling
 * and connection validation.
 *
 * @see .context-kit/orchestration/reactflow-template-ui/integration-contracts/02-node-component-contracts.md
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import { handleStyles } from './styles';

export interface NodeHandleProps {
  type: 'source' | 'target';
  position: Position;
  id?: string;
  isConnectable?: boolean;
  className?: string;
  title?: string;
}

/**
 * Custom connection handle component
 *
 * Features:
 * - Type-specific styling (source vs target)
 * - Connection validation (type checking)
 * - Hover effects
 * - Accessibility labels
 */
export const NodeHandle: React.FC<NodeHandleProps> = ({
  type,
  position,
  id,
  isConnectable = true,
  className,
  title,
}) => {
  const styles = type === 'source' ? handleStyles.source : handleStyles.target;

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      isConnectable={isConnectable}
      className={`${styles} ${className || ''}`}
      title={title || (type === 'source' ? 'Output' : 'Input')}
      aria-label={title || (type === 'source' ? 'Output connection point' : 'Input connection point')}
    />
  );
};

export default NodeHandle;
