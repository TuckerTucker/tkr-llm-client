/**
 * Canvas Component
 *
 * Main ReactFlow canvas for visualizing agent templates, fragments, variables, and tool configs.
 * Integrates with Zustand state management and provides visual node-based editing.
 *
 * @module components/canvas/Canvas
 * @version 1.0.0
 * @author Canvas & ReactFlow Integration (Agent 6)
 */

import React, { useCallback, useMemo, useState, memo } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Controls as RFControls,
  NodeTypes,
  EdgeTypes,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
  Node,
  Viewport,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '../../../../src/lib/state/canvas-store';
import {
  handleNodesChange as onNodesChangeHandler,
  handleEdgesChange as onEdgesChangeHandler,
  handleConnect as onConnectHandler,
  handleNodeClick,
  handleNodeDragEnd,
  handleEdgeClick,
  handlePaneClick,
  handleViewportChange,
} from '../../../../src/lib/reactflow/events';

// Import node components from Agent 2
import {
  BaseNode,
  TemplateNode,
  FragmentNode,
  VariableNode,
  ToolConfigNode,
  BundleNode,
  ResolvedNode,
} from '../nodes';

// Import edge component from Agent 2
import { CustomEdge } from '../edges';

// Import Controls component
import { Controls } from './Controls';

// Import NodeDetails panel from Wave 2
import { NodeDetails } from './NodeDetails';
import type { NodeData } from '../../lib/types/ui-types';

/**
 * Throttle function to limit execution rate
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecuted = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted;

    if (timeSinceLastExecution >= delay) {
      lastExecuted = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastExecuted = Date.now();
        func(...args);
      }, delay - timeSinceLastExecution);
    }
  };
}

export interface CanvasProps {
  /** Nodes to display on the canvas */
  nodes?: any[];
  /** Edges to display on the canvas */
  edges?: any[];
  /** Node change handler */
  onNodesChange?: OnNodesChange;
  /** Edge change handler */
  onEdgesChange?: OnEdgesChange;
  /** Export handler */
  onExport?: () => void;
  /** Canvas width */
  width?: number | string;
  /** Canvas height */
  height?: number | string;
  /** Whether canvas is read-only (no editing) */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show minimap */
  showMinimap?: boolean;
  /** Show background grid */
  showBackground?: boolean;
  /** Show built-in ReactFlow controls */
  showBuiltInControls?: boolean;
  /** Show custom controls */
  showCustomControls?: boolean;
}

/**
 * Internal Canvas Component (wrapped by ReactFlowProvider)
 * Memoized to prevent unnecessary re-renders
 */
const CanvasInternal: React.FC<CanvasProps> = memo(({
  nodes: propNodes = [],
  edges: propEdges = [],
  onNodesChange: propOnNodesChange,
  onEdgesChange: propOnEdgesChange,
  onExport,
  width = '100%',
  height = '100%',
  readOnly = false,
  className = '',
  showMinimap = true,
  showBackground = true,
  showBuiltInControls = false,
  showCustomControls = true,
}) => {
  // Use props if provided, otherwise fall back to canvas store
  const storeNodes = useCanvasStore((state) => state.nodes);
  const storeEdges = useCanvasStore((state) => state.edges);
  const viewport = useCanvasStore((state) => state.viewport);

  const nodes = propNodes.length > 0 ? propNodes : storeNodes;
  const edges = propEdges.length > 0 ? propEdges : storeEdges;

  const [isLocked, setIsLocked] = React.useState(readOnly);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log('🔒 Canvas lock state:', { isLocked, readOnly, nodesDraggable: !isLocked });
  }, [isLocked, readOnly]);

  // Define node types (mapping type string to component)
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      template: TemplateNode,
      fragment: FragmentNode,
      variable: VariableNode,
      toolConfig: ToolConfigNode,
      bundle: BundleNode,
      resolved: ResolvedNode,
    }),
    []
  );

  // Define edge types
  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      default: CustomEdge,
      extends: CustomEdge,
      mixin: CustomEdge,
      variable: CustomEdge,
      toolRef: CustomEdge,
    }),
    []
  );

  // Node change handler
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (isLocked) return;

      // Use prop handler if provided, otherwise use store handler
      if (propOnNodesChange) {
        propOnNodesChange(changes);
      } else {
        // Convert ReactFlow changes to our format
        const convertedChanges = changes.map((change: any) => {
          switch (change.type) {
            case 'position':
              return {
                type: 'position' as const,
                id: change.id,
                position: change.position,
              };
            case 'dimensions':
              return {
                type: 'dimensions' as const,
                id: change.id,
                dimensions: change.dimensions,
              };
            case 'select':
              return {
                type: 'select' as const,
                id: change.id,
                selected: change.selected,
              };
            case 'remove':
              return {
                type: 'remove' as const,
                id: change.id,
              };
            default:
              return change;
          }
        });
        onNodesChangeHandler(convertedChanges);
      }
    },
    [isLocked, propOnNodesChange]
  );

  // Edge change handler
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (isLocked) return;

      // Use prop handler if provided, otherwise use store handler
      if (propOnEdgesChange) {
        propOnEdgesChange(changes);
      } else {
        // Convert ReactFlow changes to our format
        const convertedChanges = changes.map((change: any) => {
          switch (change.type) {
            case 'select':
              return {
                type: 'select' as const,
                id: change.id,
                selected: change.selected,
              };
            case 'remove':
              return {
                type: 'remove' as const,
                id: change.id,
              };
            default:
              return change;
          }
        });
        onEdgesChangeHandler(convertedChanges);
      }
    },
    [isLocked, propOnEdgesChange]
  );

  // Connection handler
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (isLocked) return;
      onConnectHandler({
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
      });
    },
    [isLocked]
  );

  // Node click handler - open details panel
  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: any) => {
      handleNodeClick(event, node);
      // Open details panel for the clicked node
      setSelectedNode(node as Node<NodeData>);
    },
    []
  );

  // Node drag end handler
  const onNodeDragEndHandler = useCallback(
    (event: React.MouseEvent, node: any) => {
      handleNodeDragEnd(event, node);
    },
    []
  );

  // Edge click handler
  const onEdgeClickHandler = useCallback(
    (event: React.MouseEvent, edge: any) => {
      handleEdgeClick(event, edge);
    },
    []
  );

  // Pane click handler (background) - close details panel
  const onPaneClickHandler = useCallback((event: React.MouseEvent) => {
    handlePaneClick(event);
    // Close details panel when clicking background
    setSelectedNode(null);
  }, []);

  // Throttled viewport change handler (100ms throttle)
  const throttledViewportChange = useMemo(
    () => throttle((viewport: Viewport) => {
      handleViewportChange(viewport);
    }, 100),
    []
  );

  // Viewport change handler
  const onMoveEnd = useCallback((_event: any, viewport: Viewport) => {
    throttledViewportChange(viewport);
  }, [throttledViewportChange]);

  return (
    <div
      className={`canvas-container ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        background: '#f9fafb',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        onNodeDragStop={onNodeDragEndHandler}
        onEdgeClick={onEdgeClickHandler}
        onPaneClick={onPaneClickHandler}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={viewport}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        proOptions={{ hideAttribution: true }}
      >
        {/* Background Grid */}
        {showBackground && (
          <Background
            color="#d1d5db"
            gap={16}
            size={1}
            variant="dots"
          />
        )}

        {/* Minimap */}
        {showMinimap && (
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.type) {
                case 'template':
                  return '#3b82f6';
                case 'fragment':
                  return '#10b981';
                case 'variable':
                  return '#eab308';
                case 'toolConfig':
                  return '#3b82f6';
                case 'bundle':
                  return '#8b5cf6';
                case 'resolved':
                  return '#6b7280';
                default:
                  return '#9ca3af';
              }
            }}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
            }}
            pannable
            zoomable
          />
        )}

        {/* Built-in ReactFlow controls */}
        {showBuiltInControls && <RFControls />}
      </ReactFlow>

      {/* Custom controls */}
      {showCustomControls && (
        <Controls
          locked={isLocked}
          onLockChange={setIsLocked}
          onExport={onExport}
        />
      )}

      {/* Node details panel */}
      <NodeDetails
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Prevent re-render if nodes, edges, and key props haven't changed
  return (
    prevProps.nodes?.length === nextProps.nodes?.length &&
    prevProps.edges?.length === nextProps.edges?.length &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.showMinimap === nextProps.showMinimap &&
    prevProps.showBackground === nextProps.showBackground &&
    prevProps.showBuiltInControls === nextProps.showBuiltInControls &&
    prevProps.showCustomControls === nextProps.showCustomControls
  );
});

/**
 * Canvas Component (wrapped with ReactFlowProvider)
 *
 * Main canvas for visualizing and editing agent templates.
 *
 * Features:
 * - Drag & drop nodes
 * - Connect nodes to create relationships
 * - Zoom and pan
 * - Undo/redo
 * - Minimap
 * - Background grid
 * - Lock/unlock editing
 *
 * @param props - Component props
 */
export const Canvas: React.FC<CanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasInternal {...props} />
    </ReactFlowProvider>
  );
};

/**
 * Default export
 */
export default Canvas;
