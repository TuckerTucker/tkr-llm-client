/**
 * Drag & Drop System
 *
 * Handles drag operations including catalog → canvas drag, node repositioning,
 * ghost preview during drag, drop validation, and multi-node drag support.
 *
 * @module lib/interactions/drag-drop
 * @version 1.0.0
 * @author Interaction Engineer (Agent 2)
 */

import { useCallback, useRef, useState } from 'react';
import { Node } from '../types/reactflow';
import { NodeData } from '../types/ui-types';
import { useCanvasStore } from '../state/canvas-store';

/**
 * Drag data structure for transfer
 */
export interface DragData {
  /** Type of item being dragged */
  type: 'catalog-item' | 'canvas-node';

  /** Node data if dragging from catalog */
  nodeData?: Partial<NodeData>;

  /** Node IDs if dragging canvas nodes */
  nodeIds?: string[];

  /** Source catalog category */
  category?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Drop position information
 */
export interface DropPosition {
  /** Canvas X coordinate */
  x: number;

  /** Canvas Y coordinate */
  y: number;

  /** Whether position is valid for drop */
  valid: boolean;
}

/**
 * Ghost preview configuration
 */
export interface GhostPreview {
  /** Whether ghost is active */
  active: boolean;

  /** Ghost position */
  position: { x: number; y: number };

  /** Node type being previewed */
  nodeType?: string;

  /** Preview dimensions */
  dimensions?: { width: number; height: number };
}

/**
 * Hook for managing drag & drop operations
 *
 * @returns Drag & drop handlers and state
 */
export function useDragDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [ghostPreview, setGhostPreview] = useState<GhostPreview>({
    active: false,
    position: { x: 0, y: 0 },
  });

  const canvasRef = useRef<HTMLElement | null>(null);
  const store = useCanvasStore();

  /**
   * Start dragging from catalog
   *
   * @param nodeData - Partial node data for catalog item
   * @param category - Catalog category
   */
  const startCatalogDrag = useCallback(
    (nodeData: Partial<NodeData>, category: string) => {
      const data: DragData = {
        type: 'catalog-item',
        nodeData,
        category,
      };

      setDragData(data);
      setIsDragging(true);
      setGhostPreview({
        active: true,
        position: { x: 0, y: 0 },
        nodeType: nodeData.type,
        dimensions: { width: 200, height: 100 },
      });
    },
    []
  );

  /**
   * Start dragging canvas nodes
   *
   * @param nodeIds - Array of node IDs being dragged
   */
  const startNodeDrag = useCallback((nodeIds: string[]) => {
    const data: DragData = {
      type: 'canvas-node',
      nodeIds,
    };

    setDragData(data);
    setIsDragging(true);
  }, []);

  /**
   * Update ghost preview position during drag
   *
   * @param event - Mouse or touch event
   */
  const updateGhostPosition = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging || !ghostPreview.active) return;

      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      setGhostPreview((prev) => ({
        ...prev,
        position: { x: clientX, y: clientY },
      }));
    },
    [isDragging, ghostPreview.active]
  );

  /**
   * Convert screen coordinates to canvas coordinates
   *
   * @param screenX - Screen X coordinate
   * @param screenY - Screen Y coordinate
   * @returns Canvas coordinates
   */
  const screenToCanvasPosition = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      if (!canvasRef.current) {
        return { x: screenX, y: screenY };
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const viewport = store.viewport;

      // Transform screen coordinates to canvas space
      const canvasX = (screenX - rect.left - viewport.x) / viewport.zoom;
      const canvasY = (screenY - rect.top - viewport.y) / viewport.zoom;

      return { x: canvasX, y: canvasY };
    },
    [store.viewport]
  );

  /**
   * Validate drop position
   *
   * @param position - Drop position
   * @returns Whether drop is valid
   */
  const validateDropPosition = useCallback(
    (position: { x: number; y: number }): boolean => {
      // Basic validation: ensure position is within reasonable bounds
      // Can be extended with additional rules (e.g., no overlap)

      if (position.x < -10000 || position.x > 10000) return false;
      if (position.y < -10000 || position.y > 10000) return false;

      return true;
    },
    []
  );

  /**
   * Handle drop on canvas
   *
   * @param event - Drop event
   * @param reactFlowInstance - ReactFlow instance for coordinate conversion
   */
  const handleDrop = useCallback(
    (
      event: React.DragEvent | React.MouseEvent | React.TouchEvent,
      reactFlowInstance?: any
    ) => {
      if (!isDragging || !dragData) return;

      event.preventDefault();

      const clientX =
        'touches' in event
          ? event.changedTouches[0].clientX
          : 'clientX' in event
            ? event.clientX
            : 0;
      const clientY =
        'touches' in event
          ? event.changedTouches[0].clientY
          : 'clientY' in event
            ? event.clientY
            : 0;

      let position: { x: number; y: number };

      // Use ReactFlow instance if available for accurate positioning
      if (reactFlowInstance && reactFlowInstance.screenToFlowPosition) {
        position = reactFlowInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });
      } else {
        position = screenToCanvasPosition(clientX, clientY);
      }

      if (!validateDropPosition(position)) {
        console.warn('Invalid drop position:', position);
        handleDragEnd();
        return;
      }

      // Handle catalog item drop
      if (dragData.type === 'catalog-item' && dragData.nodeData) {
        const newNode: Node<NodeData> = {
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: dragData.nodeData.type,
          position,
          data: {
            id: `node-${Date.now()}`,
            type: dragData.nodeData.type || 'template',
            name: dragData.nodeData.name || 'New Node',
            metadata: dragData.nodeData.metadata || {},
            ...dragData.nodeData,
          } as NodeData,
          draggable: true,
          selectable: true,
        };

        store.addNode(newNode);
        store.pushHistory();
        store.selectNode(newNode.id);
      }

      // Handle canvas node repositioning (handled by ReactFlow)
      // Multi-node drag is also handled by ReactFlow's built-in functionality

      handleDragEnd();
    },
    [isDragging, dragData, screenToCanvasPosition, validateDropPosition, store]
  );

  /**
   * Handle drag over (for drop zones)
   *
   * @param event - Drag over event
   */
  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      updateGhostPosition(event);
    },
    [updateGhostPosition]
  );

  /**
   * End drag operation
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragData(null);
    setGhostPreview({
      active: false,
      position: { x: 0, y: 0 },
    });
  }, []);

  /**
   * Handle drag start event from catalog
   *
   * @param event - Drag start event
   * @param nodeData - Node data
   * @param category - Catalog category
   */
  const onCatalogDragStart = useCallback(
    (
      event: React.DragEvent,
      nodeData: Partial<NodeData>,
      category: string
    ) => {
      // Set drag data
      const data: DragData = {
        type: 'catalog-item',
        nodeData,
        category,
      };

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(data));

      startCatalogDrag(nodeData, category);
    },
    [startCatalogDrag]
  );

  /**
   * Handle touch start for mobile drag support
   *
   * @param event - Touch start event
   * @param nodeData - Node data
   * @param category - Catalog category
   */
  const onCatalogTouchStart = useCallback(
    (
      event: React.TouchEvent,
      nodeData: Partial<NodeData>,
      category: string
    ) => {
      event.preventDefault();
      startCatalogDrag(nodeData, category);
    },
    [startCatalogDrag]
  );

  /**
   * Handle touch move for mobile drag
   *
   * @param event - Touch move event
   */
  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!isDragging) return;
      updateGhostPosition(event);
    },
    [isDragging, updateGhostPosition]
  );

  /**
   * Handle touch end for mobile drop
   *
   * @param event - Touch end event
   * @param reactFlowInstance - ReactFlow instance
   */
  const onTouchEnd = useCallback(
    (event: React.TouchEvent, reactFlowInstance?: any) => {
      if (!isDragging) return;
      handleDrop(event, reactFlowInstance);
    },
    [isDragging, handleDrop]
  );

  /**
   * Set canvas ref for coordinate conversion
   *
   * @param ref - Canvas element ref
   */
  const setCanvasRef = useCallback((ref: HTMLElement | null) => {
    canvasRef.current = ref;
  }, []);

  return {
    // State
    isDragging,
    dragData,
    ghostPreview,

    // Catalog drag handlers
    onCatalogDragStart,
    onCatalogTouchStart,

    // Canvas drop handlers
    handleDrop,
    handleDragOver,
    handleDragEnd,

    // Touch handlers
    onTouchMove,
    onTouchEnd,

    // Node drag handlers
    startNodeDrag,

    // Utilities
    setCanvasRef,
    screenToCanvasPosition,
    validateDropPosition,
  };
}

/**
 * Create drag data for transfer
 *
 * @param type - Drag type
 * @param data - Additional data
 * @returns DragData object
 */
export function createDragData(
  type: DragData['type'],
  data: Partial<DragData>
): DragData {
  return {
    type,
    ...data,
  };
}

/**
 * Parse drag data from transfer
 *
 * @param dataTransfer - DataTransfer object
 * @returns Parsed DragData or null
 */
export function parseDragData(dataTransfer: DataTransfer): DragData | null {
  try {
    const data = dataTransfer.getData('application/reactflow');
    if (!data) return null;
    return JSON.parse(data) as DragData;
  } catch (error) {
    console.error('Failed to parse drag data:', error);
    return null;
  }
}
