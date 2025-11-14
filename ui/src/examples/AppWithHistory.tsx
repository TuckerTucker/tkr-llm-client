/**
 * App with History Example
 *
 * Example implementation showing proper integration of state management
 * with undo/redo functionality. This demonstrates how to:
 * - Use the canvas store
 * - Push history after operations
 * - Wire up UndoRedoControls
 * - Convert templates to canvas nodes
 *
 * @module ui/examples/AppWithHistory
 * @version 1.0.0
 * @author State Management Integration Engineer (Agent 4, Wave 1)
 */

import { useEffect, useState, useCallback } from 'react';
import { Canvas } from '../components/canvas/Canvas';
import { UndoRedoControls } from '@/../../src/components/canvas/UndoRedoControls';
import { TemplateCatalog } from '@/../../src/components/catalog/TemplateCatalog';
import { useCanvas } from '../hooks/useCanvas';
import type { AgentTemplate } from '@/../../src/templates/types';
import type { Node } from '@/../../src/lib/types/reactflow';
import type { NodeData } from '@/../../src/lib/types/ui-types';

// Demo templates
const demoTemplates: AgentTemplate[] = [
  {
    metadata: {
      name: 'code-reviewer',
      description: 'Reviews code for quality, bugs, and best practices',
      version: '1.0.0',
      tags: ['code', 'review', 'quality'],
    },
    agent: {
      description: 'Code review agent',
      prompt: 'You are a code reviewer. Analyze the provided code for bugs, security issues, and best practices.',
      tools: ['Read', 'Grep'],
    },
  },
  {
    metadata: {
      name: 'doc-generator',
      description: 'Generates documentation from code',
      version: '1.0.0',
      tags: ['documentation', 'code'],
    },
    agent: {
      description: 'Documentation generator',
      prompt: 'You are a documentation generator. Create comprehensive documentation for the provided code.',
      tools: ['Read', 'Write'],
    },
  },
];

/**
 * Simple template to nodes converter (placeholder)
 * In production, this would use the conversion utilities from Wave 1 Agent 3
 */
function convertTemplateToNodes(template: AgentTemplate): Node<NodeData>[] {
  const baseNode: Node<NodeData> = {
    id: `template-${template.metadata.name}`,
    type: 'template',
    position: { x: 250, y: 100 },
    data: {
      id: `template-${template.metadata.name}`,
      type: 'template',
      label: template.metadata.name,
      metadata: {
        name: template.metadata.name,
        description: template.metadata.description,
        version: template.metadata.version,
        tags: template.metadata.tags,
      },
      config: {
        prompt: template.agent.prompt,
        tools: template.agent.tools,
      },
    },
  };

  // Add tool nodes
  const toolNodes: Node<NodeData>[] = (template.agent.tools || []).map((tool, idx) => ({
    id: `tool-${template.metadata.name}-${tool}`,
    type: 'toolConfig',
    position: { x: 100, y: 250 + idx * 100 },
    data: {
      id: `tool-${template.metadata.name}-${tool}`,
      type: 'toolConfig',
      label: tool,
      metadata: {
        name: tool,
      },
      config: {
        enabled: true,
      },
    },
  }));

  return [baseNode, ...toolNodes];
}

function AppWithHistory() {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);

  // Use the canvas hook
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    pushHistory,
    reset,
    canUndo,
    canRedo,
  } = useCanvas();

  useEffect(() => {
    document.title = 'ReactFlow Template UI - With History';
  }, []);

  /**
   * Handle template selection
   * Converts template to nodes and pushes to history
   */
  const handleTemplateSelect = useCallback(
    (template: AgentTemplate) => {
      setSelectedTemplate(template);

      // Convert template to nodes
      const newNodes = convertTemplateToNodes(template);

      // Clear canvas first
      reset();

      // Set new nodes
      setNodes(newNodes);
      setEdges([]);

      // IMPORTANT: Push to history after setting nodes
      // This allows undo/redo to work properly
      setTimeout(() => {
        pushHistory();
      }, 0);
    },
    [reset, setNodes, setEdges, pushHistory]
  );

  /**
   * Handle clear canvas
   */
  const handleClear = useCallback(() => {
    reset();
    setSelectedTemplate(null);
  }, [reset]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Catalog Sidebar */}
      {showCatalog && (
        <div
          style={{
            width: '350px',
            height: '100%',
            borderRight: '1px solid #e5e7eb',
            backgroundColor: 'white',
            overflow: 'hidden',
          }}
        >
          <TemplateCatalog
            templates={demoTemplates}
            selectedId={selectedTemplate?.metadata.name}
            onSelect={handleTemplateSelect}
            showPreview
          />
        </div>
      )}

      {/* Main Canvas Area */}
      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        {/* Header */}
        <div
          style={{
            height: '60px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
              ReactFlow Template UI
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
              Visual Agent Template Editor with Undo/Redo
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Nodes: {nodes.length} | Edges: {edges.length}
            </div>
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {showCatalog ? 'Hide' : 'Show'} Catalog
            </button>
            <button
              onClick={handleClear}
              disabled={nodes.length === 0}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: nodes.length > 0 ? 'white' : '#f3f4f6',
                color: nodes.length > 0 ? '#374151' : '#9ca3af',
                cursor: nodes.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
              }}
            >
              Clear Canvas
            </button>
            {selectedTemplate && (
              <div style={{ fontSize: '14px', color: '#374151' }}>
                <strong>Selected:</strong> {selectedTemplate.metadata.name}
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ height: 'calc(100% - 60px)', position: 'relative' }}>
          <Canvas
            showMinimap
            showBackground
            showCustomControls
          />

          {/* Undo/Redo Controls */}
          <UndoRedoControls position="bottom-right" showShortcuts />

          {/* History Status */}
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              right: 10,
              padding: '8px 12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              fontSize: '12px',
              color: '#6b7280',
              zIndex: 10,
            }}
          >
            <div>Undo: {canUndo ? '✓' : '✗'}</div>
            <div>Redo: {canRedo ? '✓' : '✗'}</div>
          </div>

          {/* Welcome Message */}
          {!selectedTemplate && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Welcome to ReactFlow Template UI
              </h2>
              <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                Select a template from the catalog to get started
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                Try Cmd/Ctrl+Z to undo and Cmd/Ctrl+Shift+Z to redo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppWithHistory;
