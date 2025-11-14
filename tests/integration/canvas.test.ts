/**
 * Canvas Integration Test
 *
 * Tests the complete flow: Load template → convert to node → render on canvas
 * This validates that all Wave 1 agents integrate correctly.
 *
 * @module tests/integration/canvas
 * @version 1.0.0
 * @author Canvas & ReactFlow Integration (Agent 6)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateRegistry } from '../../src/templates/registry';
import { templateToNode } from '../../src/lib/adapters/template-adapter';
import { useCanvasStore } from '../../src/lib/state/canvas-store';

describe('Canvas Integration Test', () => {
  let registry: TemplateRegistry;
  const TEST_TEMPLATES_DIR = './tests/fixtures/templates';

  beforeEach(async () => {
    // Reset canvas store
    useCanvasStore.getState().reset();

    // Initialize registry
    registry = new TemplateRegistry(TEST_TEMPLATES_DIR);
    await registry.scan();
  });

  afterEach(() => {
    useCanvasStore.getState().reset();
  });

  describe('Template → Node → Canvas Flow', () => {
    it('should load template, convert to node, and add to canvas', async () => {
      // Step 1: Load template from registry (Agent 1 - Template System)
      const catalog = registry.getCatalog();
      expect(catalog.count).toBeGreaterThan(0);

      const templateName = catalog.templates[0].name;
      const template = registry.getTemplate(templateName);
      expect(template).toBeDefined();
      expect(template!.metadata.name).toBeDefined();

      // Step 2: Convert template to ReactFlow node (Agent 1 - Data Bridge)
      const node = templateToNode(template!, { x: 100, y: 100 });

      expect(node).toBeDefined();
      expect(node.id).toBe(`node-${template!.metadata.name}`);
      expect(node.type).toBe('template');
      expect(node.position).toEqual({ x: 100, y: 100 });
      expect(node.data.type).toBe('template');
      expect(node.data.name).toBe(template!.metadata.name);

      // Step 3: Add node to canvas store (Agent 3 - State Management)
      const store = useCanvasStore.getState();
      store.addNode(node);

      // Verify node is in store
      const nodes = store.nodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe(node.id);
      expect(nodes[0].data.name).toBe(template!.metadata.name);

      // Step 4: Verify node can be retrieved
      const retrievedNode = store.getNodeById(node.id);
      expect(retrievedNode).toBeDefined();
      expect(retrievedNode?.id).toBe(node.id);
    });

    it('should convert multiple templates and maintain relationships', async () => {
      const catalog = registry.getCatalog();

      if (catalog.count < 2) {
        console.warn('Not enough templates for relationship test');
        return;
      }

      const store = useCanvasStore.getState();

      // Convert all templates to nodes
      const nodes = catalog.templates.map((entry, index) => {
        const template = registry.getTemplate(entry.name);
        return templateToNode(template!, {
          x: 100 + index * 250,
          y: 100,
        });
      });

      // Add all nodes to canvas
      store.addNodes(nodes);

      // Verify all nodes are in store
      expect(store.nodes).toHaveLength(catalog.count);

      // Verify nodes can be queried by type
      const templateNodes = store.getNodesByType('template');
      expect(templateNodes).toHaveLength(catalog.count);
    });

    it('should support node selection', () => {
      const store = useCanvasStore.getState();

      // Create a test node
      const template = {
        metadata: {
          name: 'test-template',
          description: 'Test template',
          version: '1.0.0',
        },
        agent: {
          description: 'Test template',
          prompt: 'Test prompt',
          tools: ['Read'],
        },
      };

      const node = templateToNode(template as any, { x: 0, y: 0 });
      store.addNode(node);

      // Select the node
      store.selectNode(node.id);

      // Verify selection
      expect(store.selectedNodes).toContain(node.id);
      expect(store.nodes[0].selected).toBe(true);

      // Clear selection
      store.clearSelection();
      expect(store.selectedNodes).toHaveLength(0);
      expect(store.nodes[0].selected).toBe(false);
    });

    it('should support undo/redo', () => {
      const store = useCanvasStore.getState();

      // Initial state: no nodes
      expect(store.nodes).toHaveLength(0);
      expect(store.canUndo()).toBe(false);

      // Add a node
      const template = {
        metadata: {
          name: 'test-template',
          description: 'Test',
          version: '1.0.0',
        },
        agent: {
          description: 'Test',
          prompt: 'Test',
          tools: ['Read'],
        },
      };

      const node = templateToNode(template as any, { x: 0, y: 0 });

      // Push to history before change
      store.pushHistory();
      store.addNode(node);

      expect(store.nodes).toHaveLength(1);

      // Push to history after change
      store.pushHistory();

      // Undo should remove the node
      expect(store.canUndo()).toBe(true);
      store.undo();

      expect(store.nodes).toHaveLength(0);

      // Redo should restore the node
      expect(store.canRedo()).toBe(true);
      store.redo();

      expect(store.nodes).toHaveLength(1);
      expect(store.nodes[0].id).toBe(node.id);
    });

    it('should handle viewport changes', () => {
      const store = useCanvasStore.getState();

      // Initial viewport
      expect(store.viewport).toEqual({ x: 0, y: 0, zoom: 1 });

      // Change viewport
      store.setViewport({ x: 100, y: 100, zoom: 1.5 });

      expect(store.viewport).toEqual({ x: 100, y: 100, zoom: 1.5 });

      // Reset viewport
      store.resetViewport();

      expect(store.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('should handle node removal with connected edges', () => {
      const store = useCanvasStore.getState();

      // Create two nodes
      const template1 = {
        metadata: { name: 'template1', description: 'Test 1', version: '1.0.0' },
        agent: { description: 'Test 1', prompt: 'Test 1', tools: ['Read'] },
      };
      const template2 = {
        metadata: { name: 'template2', description: 'Test 2', version: '1.0.0' },
        agent: { description: 'Test 2', prompt: 'Test 2', tools: ['Write'] },
      };

      const node1 = templateToNode(template1 as any, { x: 0, y: 0 });
      const node2 = templateToNode(template2 as any, { x: 200, y: 0 });

      store.addNodes([node1, node2]);

      // Create edge between them
      store.addEdge({
        id: 'edge-1',
        source: node1.id,
        target: node2.id,
        type: 'extends',
        data: { type: 'extends', metadata: {} },
      });

      expect(store.nodes).toHaveLength(2);
      expect(store.edges).toHaveLength(1);

      // Remove first node - should also remove connected edge
      store.removeNode(node1.id);

      expect(store.nodes).toHaveLength(1);
      expect(store.edges).toHaveLength(0); // Edge should be removed
    });
  });

  describe('Agent Integration Validation', () => {
    it('should validate Agent 1 (Data Bridge) deliverables', async () => {
      const catalog = registry.getCatalog();
      expect(catalog.count).toBeGreaterThan(0);

      const templateName = catalog.templates[0].name;
      const template = registry.getTemplate(templateName);
      const node = templateToNode(template!);

      // Validate node structure matches contract
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('position');
      expect(node).toHaveProperty('data');
      expect(node.data).toHaveProperty('type');
      expect(node.data).toHaveProperty('name');
      expect(node.data).toHaveProperty('metadata');
    });

    it('should validate Agent 3 (State Management) deliverables', () => {
      const store = useCanvasStore.getState();

      // Validate store has required methods
      expect(store.addNode).toBeDefined();
      expect(store.addNodes).toBeDefined();
      expect(store.updateNode).toBeDefined();
      expect(store.removeNode).toBeDefined();
      expect(store.getNodeById).toBeDefined();
      expect(store.getNodesByType).toBeDefined();

      expect(store.addEdge).toBeDefined();
      expect(store.selectNode).toBeDefined();
      expect(store.setViewport).toBeDefined();
      expect(store.undo).toBeDefined();
      expect(store.redo).toBeDefined();
    });

    it('should validate Agent 6 (Canvas) event handlers exist', async () => {
      // Import event handlers
      const {
        handleNodesChange,
        handleEdgesChange,
        handleConnect,
        handleNodeClick,
        handlePaneClick,
        isValidConnection,
      } = await import('../../src/lib/reactflow/events');

      expect(handleNodesChange).toBeDefined();
      expect(handleEdgesChange).toBeDefined();
      expect(handleConnect).toBeDefined();
      expect(handleNodeClick).toBeDefined();
      expect(handlePaneClick).toBeDefined();
      expect(isValidConnection).toBeDefined();
    });

    it('should validate Agent 6 (Canvas) viewport utilities exist', async () => {
      const {
        zoomIn,
        zoomOut,
        setZoom,
        resetZoom,
        fitViewToNodes,
        centerOnNode,
      } = await import('../../src/lib/reactflow/viewport');

      expect(zoomIn).toBeDefined();
      expect(zoomOut).toBeDefined();
      expect(setZoom).toBeDefined();
      expect(resetZoom).toBeDefined();
      expect(fitViewToNodes).toBeDefined();
      expect(centerOnNode).toBeDefined();
    });
  });

  describe('Performance Validation', () => {
    it('should handle 50 nodes without performance degradation', async () => {
      const store = useCanvasStore.getState();

      const startTime = Date.now();

      // Create 50 nodes
      const nodes = Array.from({ length: 50 }, (_, i) => {
        const template = {
          metadata: {
            name: `template-${i}`,
            description: `Test template ${i}`,
            version: '1.0.0',
          },
          agent: {
            description: `Test template ${i}`,
            prompt: `Test prompt ${i}`,
            tools: ['Read'],
          },
        };

        return templateToNode(template as any, {
          x: (i % 10) * 250,
          y: Math.floor(i / 10) * 200,
        });
      });

      store.addNodes(nodes);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(store.nodes).toHaveLength(50);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms

      // Verify retrieval performance
      const retrievalStart = Date.now();
      const node25 = store.getNodeById('node-template-25');
      const retrievalEnd = Date.now();

      expect(node25).toBeDefined();
      expect(retrievalEnd - retrievalStart).toBeLessThan(10); // < 10ms lookup
    });
  });
});
