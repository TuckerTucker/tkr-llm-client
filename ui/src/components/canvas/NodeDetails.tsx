/**
 * NodeDetails Component
 *
 * Slide-out details panel for selected nodes on the canvas.
 * Shows comprehensive node information, connections, and quick actions.
 *
 * @module components/canvas/NodeDetails
 * @version 1.0.0
 * @author Visual Enhancement Engineer (Agent 3, Wave 2)
 */

import React, { useEffect, useCallback } from 'react';
import type { Node } from 'reactflow';
import type {
  NodeData,
  TemplateNodeData,
  FragmentNodeData,
  VariableNodeData,
  ToolConfigNodeData,
  BundleNodeData,
} from '../../lib/types/ui-types';
import { useCanvas } from '../../hooks/useCanvas';
import { cn } from '../nodes/styles';

export interface NodeDetailsProps {
  /** Selected node to display details for */
  node: Node<NodeData> | null;

  /** Callback when panel is closed */
  onClose: () => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * NodeDetails Panel Component
 *
 * Layout:
 * ```
 * ┌──────────────────────────────┐
 * │ [X] Node Details       [Close]│
 * ├──────────────────────────────┤
 * │                              │
 * │ Type: Template               │
 * │ Name: code-reviewer          │
 * │ Version: 1.0.0               │
 * │                              │
 * │ Description:                 │
 * │ Reviews code for quality...  │
 * │                              │
 * │ Tags: code, review, quality  │
 * │                              │
 * │ ─────────────────────────── │
 * │                              │
 * │ Connections:                 │
 * │ → Uses Tool: Read            │
 * │ → Uses Tool: Grep            │
 * │                              │
 * │ ─────────────────────────── │
 * │                              │
 * │ [Edit] [Duplicate] [Delete]  │
 * │                              │
 * └──────────────────────────────┘
 * ```
 *
 * @param props - Component props
 */
export const NodeDetails: React.FC<NodeDetailsProps> = ({
  node,
  onClose,
  className = '',
}) => {
  const { edges, getNodeById, updateNode, removeNode, addNode, pushHistory } = useCanvas();

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (node) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [node, onClose]);

  // Action handlers
  const handleEdit = useCallback(() => {
    if (!node) return;

    // Simple inline editor using prompt
    const currentName = node.data.name;
    const newName = window.prompt('Edit node name:', currentName);

    if (newName && newName !== currentName) {
      updateNode(node.id, {
        ...node,
        data: {
          ...node.data,
          name: newName,
        },
      });
      pushHistory();
    }
  }, [node, updateNode, pushHistory]);

  const handleDuplicate = useCallback(() => {
    if (!node) return;

    // Create a duplicate node with offset position
    const duplicateNode = {
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        id: `${node.data.id}-copy`,
        name: `${node.data.name} (Copy)`,
      },
      selected: false,
    };

    addNode(duplicateNode);
    pushHistory();

    // Close the details panel
    onClose();
  }, [node, addNode, pushHistory, onClose]);

  const handleDelete = useCallback(() => {
    if (!node) return;

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${node.data.name}"?\n\nThis action cannot be undone.`
    );

    if (confirmed) {
      removeNode(node.id);
      pushHistory();
      onClose();
    }
  }, [node, removeNode, pushHistory, onClose]);

  // Get connections for the node
  const getConnections = useCallback(() => {
    if (!node) return { incoming: [], outgoing: [] };

    const incoming = edges
      .filter((edge) => edge.target === node.id)
      .map((edge) => {
        const sourceNode = getNodeById(edge.source);
        return {
          id: edge.id,
          type: edge.data?.type || 'toolRef',
          label: edge.data?.label || edge.data?.type || 'connection',
          sourceNode,
        };
      });

    const outgoing = edges
      .filter((edge) => edge.source === node.id)
      .map((edge) => {
        const targetNode = getNodeById(edge.target);
        return {
          id: edge.id,
          type: edge.data?.type || 'toolRef',
          label: edge.data?.label || edge.data?.type || 'connection',
          targetNode,
        };
      });

    return { incoming, outgoing };
  }, [node, edges, getNodeById]);

  // If no node selected, don't render
  if (!node) return null;

  const { incoming, outgoing } = getConnections();
  const data = node.data;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col',
          'border-l border-gray-200',
          className
        )}
        role="dialog"
        aria-labelledby="node-details-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2
            id="node-details-title"
            className="text-lg font-semibold text-gray-900"
          >
            Node Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Close panel"
            title="Close (Esc)"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Node Type and ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Type:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                {data.type}
              </span>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">Name:</div>
              <div className="text-lg font-semibold text-gray-900">
                {data.name}
              </div>
            </div>

            <div className="text-xs text-gray-400 font-mono">
              ID: {data.id}
            </div>
          </div>

          {/* Validation Status */}
          {data.validationState && (
            <div className="p-3 rounded-lg bg-gray-50 border">
              <div className="flex items-center gap-2">
                {data.validationState.valid ? (
                  <>
                    <span className="text-green-600">✓</span>
                    <span className="text-sm font-medium text-green-700">
                      Valid
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">✗</span>
                    <span className="text-sm font-medium text-red-700">
                      {data.validationState.errors.length} error(s)
                    </span>
                  </>
                )}
              </div>

              {!data.validationState.valid && (
                <ul className="mt-2 space-y-1">
                  {data.validationState.errors.map((error, i) => (
                    <li key={i} className="text-xs text-red-600">
                      • {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Type-specific details */}
          {renderTypeSpecificDetails(data)}

          {/* Connections */}
          {(incoming.length > 0 || outgoing.length > 0) && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b">
                Connections
              </div>

              {/* Incoming connections */}
              {incoming.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Incoming ({incoming.length})
                  </div>
                  <ul className="space-y-1">
                    {incoming.map((conn) => (
                      <li
                        key={conn.id}
                        className="text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span className="text-gray-400">←</span>
                        <span className="font-medium">{conn.label}</span>
                        {conn.sourceNode && (
                          <span className="text-xs text-gray-500">
                            from {conn.sourceNode.data.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Outgoing connections */}
              {outgoing.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Outgoing ({outgoing.length})
                  </div>
                  <ul className="space-y-1">
                    {outgoing.map((conn) => (
                      <li
                        key={conn.id}
                        className="text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span className="text-gray-400">→</span>
                        <span className="font-medium">{conn.label}</span>
                        {conn.targetNode && (
                          <span className="text-xs text-gray-500">
                            to {conn.targetNode.data.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Edit
            </button>
            <button
              onClick={handleDuplicate}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Render type-specific details based on node type
 */
function renderTypeSpecificDetails(data: NodeData): React.ReactNode {
  switch (data.type) {
    case 'template':
      return <TemplateDetails data={data as TemplateNodeData} />;
    case 'fragment':
      return <FragmentDetails data={data as FragmentNodeData} />;
    case 'variable':
      return <VariableDetails data={data as VariableNodeData} />;
    case 'toolConfig':
      return <ToolConfigDetails data={data as ToolConfigNodeData} />;
    case 'bundle':
      return <BundleDetails data={data as BundleNodeData} />;
    default:
      return null;
  }
}

/**
 * Template-specific details
 */
function TemplateDetails({ data }: { data: TemplateNodeData }) {
  return (
    <div className="space-y-3">
      {/* Description */}
      {data.description && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Description:
          </div>
          <p className="text-sm text-gray-700">{data.description}</p>
        </div>
      )}

      {/* Version */}
      {data.version && (
        <div>
          <span className="text-sm font-medium text-gray-500">Version: </span>
          <span className="text-sm text-gray-700">{data.version}</span>
        </div>
      )}

      {/* Tags */}
      {data.tags.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">Tags:</div>
          <div className="flex flex-wrap gap-1">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      {data.tools.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">Tools:</div>
          <div className="text-sm text-gray-700">{data.tools.join(', ')}</div>
        </div>
      )}

      {/* Extends */}
      {data.extends && (
        <div>
          <span className="text-sm font-medium text-gray-500">Extends: </span>
          <span className="text-sm text-purple-700 font-medium">
            {data.extends}
          </span>
        </div>
      )}

      {/* Mixins */}
      {data.mixins && data.mixins.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">Mixins:</div>
          <div className="text-sm text-green-700">{data.mixins.join(', ')}</div>
        </div>
      )}

      {/* Variables */}
      {(data.requiredVariables.length > 0 ||
        data.optionalVariables.length > 0) && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Variables:
          </div>
          {data.requiredVariables.length > 0 && (
            <div className="text-sm text-gray-700">
              Required: {data.requiredVariables.join(', ')}
            </div>
          )}
          {data.optionalVariables.length > 0 && (
            <div className="text-sm text-gray-600">
              Optional: {data.optionalVariables.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Fragment-specific details
 */
function FragmentDetails({ data }: { data: FragmentNodeData }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-gray-500 mb-1">
          Instructions:
        </div>
        <p className="text-sm text-gray-700">{data.instructions}</p>
      </div>

      <div>
        <span className="text-sm font-medium text-gray-500">Type: </span>
        <span className="text-sm text-gray-700">{data.fragmentType}</span>
      </div>

      {data.usedBy.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Used by:
          </div>
          <div className="text-sm text-gray-700">{data.usedBy.join(', ')}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Variable-specific details
 */
function VariableDetails({ data }: { data: VariableNodeData }) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm font-medium text-gray-500">Variable: </span>
        <span className="text-sm font-mono text-gray-900">
          {data.variableName}
        </span>
      </div>

      <div>
        <span className="text-sm font-medium text-gray-500">Type: </span>
        <span className="text-sm text-gray-700">{data.variableType}</span>
      </div>

      <div>
        <span className="text-sm font-medium text-gray-500">Required: </span>
        <span className="text-sm text-gray-700">
          {data.required ? 'Yes' : 'No'}
        </span>
      </div>

      {data.defaultValue !== undefined && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Default Value:
          </div>
          <div className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded">
            {JSON.stringify(data.defaultValue)}
          </div>
        </div>
      )}

      {data.value !== undefined && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Current Value:
          </div>
          <div className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded">
            {JSON.stringify(data.value)}
          </div>
        </div>
      )}

      {data.enumOptions && data.enumOptions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">Options:</div>
          <div className="flex flex-wrap gap-1">
            {data.enumOptions.map((option) => (
              <span
                key={option}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ToolConfig-specific details
 */
function ToolConfigDetails({ data }: { data: ToolConfigNodeData }) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm font-medium text-gray-500">Tool: </span>
        <span className="text-sm font-mono text-gray-900">{data.toolName}</span>
      </div>

      {data.extends && (
        <div>
          <span className="text-sm font-medium text-gray-500">Extends: </span>
          <span className="text-sm text-purple-700 font-medium">
            {data.extends}
          </span>
        </div>
      )}

      {data.permissions && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Permissions:
          </div>
          {data.permissions.allowed.length > 0 && (
            <div className="text-xs text-green-700">
              Allowed: {data.permissions.allowed.join(', ')}
            </div>
          )}
          {data.permissions.forbidden.length > 0 && (
            <div className="text-xs text-red-700">
              Forbidden: {data.permissions.forbidden.join(', ')}
            </div>
          )}
        </div>
      )}

      {data.errorHandling && (
        <div>
          <span className="text-sm font-medium text-gray-500">
            Error Strategy:{' '}
          </span>
          <span className="text-sm text-gray-700">
            {data.errorHandling.strategy}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Bundle-specific details
 */
function BundleDetails({ data }: { data: BundleNodeData }) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-sm font-medium text-gray-500">Bundle: </span>
        <span className="text-sm font-mono text-gray-900">
          {data.bundleName}
        </span>
      </div>

      {data.containedTools.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Contained Tools ({data.containedTools.length}):
          </div>
          <ul className="space-y-1">
            {data.containedTools.map((tool) => (
              <li key={tool} className="text-sm text-gray-700">
                • {tool}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NodeDetails;
