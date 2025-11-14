/**
 * Drag & Drop Hook for ReactFlow Canvas
 *
 * Provides drag & drop functionality for dragging templates from catalog onto the canvas.
 * Integrates with the backend drag-drop system and canvas store.
 *
 * @module hooks/useDragAndDrop
 * @version 1.0.0
 * @author Interaction Engineer (Agent 2)
 */

import { useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useDragDrop } from '@/../../src/lib/interactions/drag-drop';
import { useCanvasStore } from '@/../../src/lib/state/canvas-store';
import type { Node } from '@/../../src/lib/types/reactflow';
import type { NodeData } from '@/../../src/lib/types/ui-types';

/**
 * Agent template type (from the template system)
 */
export interface AgentTemplate {
  metadata: {
    name: string;
    description?: string;
    version?: string;
    tags?: string[];
  };
  agent: {
    description: string;
    prompt: string;
    tools?: string[];
  };
}

/**
 * Drag and drop hook for canvas
 *
 * Provides handlers and state for dragging templates from catalog to canvas.
 *
 * @returns Drag and drop handlers and state
 */
export function useDragAndDrop() {
  const reactFlowInstance = useReactFlow();
  const store = useCanvasStore();
  const [dropPreview, setDropPreview] = useState<Node<NodeData> | null>(null);

  // Use backend drag-drop handler
  const dragDrop = useDragDrop();

  /**
   * Start dragging a template from the catalog
   *
   * @param event - Drag start event
   * @param template - Template being dragged
   */
  const onDragStart = useCallback(
    (event: React.DragEvent, template: AgentTemplate) => {
      // Create node data from template
      const nodeData: Partial<NodeData> = {
        type: 'template',
        name: template.metadata.name,
        metadata: {
          description: template.metadata.description,
          version: template.metadata.version,
          tags: template.metadata.tags,
          tools: template.agent.tools,
        },
      };

      // Call backend drag handler
      dragDrop.onCatalogDragStart(event, nodeData, 'templates');

      // Create preview
      const previewNode: Node<NodeData> = {
        id: 'preview',
        type: 'template',
        position: { x: 0, y: 0 },
        data: {
          id: 'preview',
          type: 'template',
          name: template.metadata.name,
          metadata: nodeData.metadata || {},
        },
      };
      setDropPreview(previewNode);
    },
    [dragDrop]
  );

  /**
   * Handle drag over canvas
   *
   * @param event - Drag over event
   */
  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      dragDrop.handleDragOver(event);
    },
    [dragDrop]
  );

  /**
   * Handle drop on canvas
   *
   * @param event - Drop event
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Clear preview
      setDropPreview(null);

      // Handle drop with ReactFlow instance for accurate positioning
      dragDrop.handleDrop(event, reactFlowInstance);
    },
    [dragDrop, reactFlowInstance]
  );

  /**
   * Handle drag end (cleanup)
   */
  const onDragEnd = useCallback(() => {
    setDropPreview(null);
    dragDrop.handleDragEnd();
  }, [dragDrop]);

  return {
    // State
    isDragging: dragDrop.isDragging,
    draggedItem: dragDrop.dragData?.nodeData || null,
    dropPreview,
    ghostPreview: dragDrop.ghostPreview,

    // Handlers
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,

    // Utilities
    setCanvasRef: dragDrop.setCanvasRef,
  };
}

/**
 * Hook for making catalog items draggable
 *
 * Returns props to spread onto catalog items to make them draggable.
 *
 * @param template - Template to make draggable
 * @returns Draggable props
 */
export function useDraggableTemplate(template: AgentTemplate) {
  const { onDragStart } = useDragAndDrop();

  return {
    draggable: true,
    onDragStart: (event: React.DragEvent) => onDragStart(event, template),
    style: { cursor: 'grab' },
  };
}
