/**
 * Layout Example
 *
 * Example demonstrating the use of useAutoLayout and LayoutSelector
 * with all 7 layout algorithms.
 *
 * @module examples/LayoutExample
 * @version 1.0.0
 * @author Layout Integration Engineer (Agent 2) - Wave 1
 */

import React, { useState } from 'react';
import { useAutoLayout } from '../hooks/useAutoLayout';
import { LayoutSelector } from '../components/canvas/LayoutSelector';
import type { Node, Edge } from '../../../src/lib/types/reactflow';
import type { NodeData, EdgeData } from '../lib/types/ui-types';

/**
 * Create demo template nodes
 */
const createDemoNodes = (): Node<NodeData>[] => {
  return [
    {
      id: 'template-1',
      type: 'template',
      position: { x: 0, y: 0 },
      data: {
        id: 'template-1',
        type: 'template',
        name: 'Base Template',
        description: 'Base template with common functionality',
        tags: ['base', 'core'],
        tools: ['bash', 'read', 'write'],
        requiredVariables: [],
        optionalVariables: [],
        metadata: {},
      },
    },
    {
      id: 'template-2',
      type: 'template',
      position: { x: 0, y: 0 },
      data: {
        id: 'template-2',
        type: 'template',
        name: 'API Template',
        description: 'Template for API development',
        tags: ['api', 'backend'],
        tools: ['bash', 'read', 'write', 'webfetch'],
        extends: 'template-1',
        requiredVariables: ['api_endpoint'],
        optionalVariables: [],
        metadata: {},
      },
    },
    {
      id: 'template-3',
      type: 'template',
      position: { x: 0, y: 0 },
      data: {
        id: 'template-3',
        type: 'template',
        name: 'Frontend Template',
        description: 'Template for frontend development',
        tags: ['frontend', 'ui'],
        tools: ['bash', 'read', 'write'],
        extends: 'template-1',
        requiredVariables: [],
        optionalVariables: ['theme'],
        metadata: {},
      },
    },
    {
      id: 'template-4',
      type: 'template',
      position: { x: 0, y: 0 },
      data: {
        id: 'template-4',
        type: 'template',
        name: 'Full Stack Template',
        description: 'Combined frontend and backend',
        tags: ['fullstack'],
        tools: ['bash', 'read', 'write', 'webfetch'],
        extends: 'template-2',
        mixins: ['template-3'],
        requiredVariables: ['api_endpoint'],
        optionalVariables: ['theme'],
        metadata: {},
      },
    },
    {
      id: 'fragment-1',
      type: 'fragment',
      position: { x: 0, y: 0 },
      data: {
        id: 'fragment-1',
        type: 'fragment',
        name: 'Error Handling',
        instructions: 'Handle errors gracefully',
        fragmentType: 'system',
        usedBy: ['template-1', 'template-2', 'template-3'],
        metadata: {},
      },
    },
    {
      id: 'variable-1',
      type: 'variable',
      position: { x: 0, y: 0 },
      data: {
        id: 'variable-1',
        type: 'variable',
        name: 'api_endpoint',
        variableName: 'api_endpoint',
        value: 'https://api.example.com',
        variableType: 'string',
        required: true,
        metadata: {},
      },
    },
  ];
};

/**
 * Create demo edges
 */
const createDemoEdges = (): Edge<EdgeData>[] => {
  return [
    {
      id: 'e1',
      source: 'template-2',
      target: 'template-1',
      type: 'extends',
      data: { id: 'e1', type: 'extends', label: 'extends' },
    },
    {
      id: 'e2',
      source: 'template-3',
      target: 'template-1',
      type: 'extends',
      data: { id: 'e2', type: 'extends', label: 'extends' },
    },
    {
      id: 'e3',
      source: 'template-4',
      target: 'template-2',
      type: 'extends',
      data: { id: 'e3', type: 'extends', label: 'extends' },
    },
    {
      id: 'e4',
      source: 'template-4',
      target: 'template-3',
      type: 'mixin',
      data: { id: 'e4', type: 'mixin', label: 'mixin', animated: true },
    },
    {
      id: 'e5',
      source: 'template-1',
      target: 'fragment-1',
      type: 'variable',
      data: { id: 'e5', type: 'variable', label: 'uses' },
    },
    {
      id: 'e6',
      source: 'template-2',
      target: 'variable-1',
      type: 'variable',
      data: { id: 'e6', type: 'variable', label: 'requires' },
    },
  ];
};

/**
 * Layout Example Component
 */
export const LayoutExample: React.FC = () => {
  const [nodes] = useState<Node<NodeData>[]>(createDemoNodes());
  const [edges] = useState<Edge<EdgeData>[]>(createDemoEdges());

  const {
    layoutedNodes,
    layoutedEdges,
    isLayouting,
    lastLayoutTime,
    currentAlgorithm,
    applyLayout,
    resetLayout,
    canAnimate,
  } = useAutoLayout(nodes, edges, {
    algorithm: 'dagre',
    animated: true,
    duration: 300,
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Layout System Demo</h1>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <LayoutSelector currentLayout={currentAlgorithm} onLayoutChange={applyLayout} />

          <button
            onClick={resetLayout}
            style={{
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reset Layout
          </button>
        </div>

        {/* Status */}
        <div
          style={{
            padding: '12px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          <div>
            <strong>Current Algorithm:</strong> {currentAlgorithm}
          </div>
          <div>
            <strong>Layout Time:</strong> {lastLayoutTime.toFixed(2)}ms
          </div>
          <div>
            <strong>Status:</strong> {isLayouting ? 'Layouting...' : 'Ready'}
          </div>
          <div>
            <strong>Animation:</strong> {canAnimate ? 'Enabled' : 'Disabled'}
          </div>
          <div>
            <strong>Nodes:</strong> {layoutedNodes.length} | <strong>Edges:</strong>{' '}
            {layoutedEdges.length}
          </div>
        </div>
      </div>

      {/* Simple visualization */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <svg width="100%" height="100%">
          {/* Draw edges */}
          {layoutedEdges.map((edge) => {
            const sourceNode = layoutedNodes.find((n) => n.id === edge.source);
            const targetNode = layoutedNodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            return (
              <line
                key={edge.id}
                x1={sourceNode.position.x + 75}
                y1={sourceNode.position.y + 25}
                x2={targetNode.position.x + 75}
                y2={targetNode.position.y + 25}
                stroke={edge.type === 'extends' ? '#3b82f6' : '#8b5cf6'}
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity="0.6"
              />
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
            </marker>
          </defs>

          {/* Draw nodes */}
          {layoutedNodes.map((node) => {
            const color =
              node.data.type === 'template'
                ? '#3b82f6'
                : node.data.type === 'fragment'
                  ? '#10b981'
                  : '#eab308';

            return (
              <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
                <rect width="150" height="50" rx="6" fill={color} opacity="0.9" />
                <text
                  x="75"
                  y="28"
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="600"
                >
                  {node.data.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: '#eff6ff',
          border: '1px solid #dbeafe',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#1e40af',
        }}
      >
        <strong>Keyboard Shortcuts:</strong>
        <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
          <li>
            Press <kbd>L</kbd> to open the layout selector
          </li>
          <li>
            Press <kbd>1-7</kbd> to quickly select a layout (when selector is open)
          </li>
          <li>
            Press <kbd>Cmd/Ctrl + L</kbd> to re-apply the current layout
          </li>
          <li>
            Press <kbd>Esc</kbd> to close the selector
          </li>
          <li>Use Arrow keys to navigate layouts (when selector is open)</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Default export
 */
export default LayoutExample;
