# ReactFlow Template UI - API Documentation

**Version:** 1.0.0
**Last Updated:** November 10, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Hooks](#hooks)
2. [Components](#components)
3. [Types](#types)
4. [Utilities](#utilities)
5. [Store](#store)

---

## Hooks

### useCanvas()

Canvas state management hook with full CRUD operations and history.

**Import:**
```typescript
import { useCanvas } from '@/hooks/useCanvas';
```

**Signature:**
```typescript
function useCanvas(): {
  // State
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: Viewport;

  // Node Operations
  addNode: (node: Node<NodeData>) => void;
  updateNode: (nodeId: string, updates: Partial<Node<NodeData>>) => void;
  removeNode: (nodeId: string) => void;
  getNodeById: (nodeId: string) => Node<NodeData> | undefined;

  // Edge Operations
  addEdge: (edge: Edge<EdgeData>) => void;
  updateEdge: (edgeId: string, updates: Partial<Edge<EdgeData>>) => void;
  removeEdge: (edgeId: string) => void;
  getEdgeById: (edgeId: string) => Edge<EdgeData> | undefined;

  // Selection
  selectNode: (nodeId: string) => void;
  selectNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;

  // Viewport
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;
  fitView: () => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: () => void;
  clearHistory: () => void;

  // Batch Operations
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge<EdgeData>[]) => void;
  reset: () => void;
}
```

**Usage:**
```typescript
function MyComponent() {
  const {
    nodes,
    addNode,
    undo,
    canUndo,
    pushHistory
  } = useCanvas();

  const handleAddNode = () => {
    addNode({
      id: 'new-node',
      type: 'template',
      position: { x: 100, y: 100 },
      data: { /* ... */ }
    });
    setTimeout(() => pushHistory(), 0);
  };

  return (
    <>
      <button onClick={handleAddNode}>Add Node</button>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
    </>
  );
}
```

**Notes:**
- Call `pushHistory()` after batch operations
- Use `setTimeout(() => pushHistory(), 0)` to ensure state updates complete
- History limited to 50 states

---

### useCanvasHistory()

Optimized hook for history operations only (prevents unnecessary re-renders).

**Import:**
```typescript
import { useCanvasHistory } from '@/hooks/useCanvas';
```

**Signature:**
```typescript
function useCanvasHistory(): {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pushHistory: () => void;
  clearHistory: () => void;
}
```

**Usage:**
```typescript
function UndoButton() {
  const { undo, canUndo } = useCanvasHistory();
  return <button onClick={undo} disabled={!canUndo}>Undo</button>;
}
```

---

### useCanvasSelection()

Optimized hook for selection operations only.

**Import:**
```typescript
import { useCanvasSelection } from '@/hooks/useCanvas';
```

**Signature:**
```typescript
function useCanvasSelection(): {
  selectedNodes: string[];
  selectedEdges: string[];
  selectNode: (nodeId: string) => void;
  selectNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;
}
```

---

### useCanvasViewport()

Optimized hook for viewport operations only.

**Import:**
```typescript
import { useCanvasViewport } from '@/hooks/useCanvas';
```

**Signature:**
```typescript
function useCanvasViewport(): {
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;
  resetViewport: () => void;
  fitView: () => void;
}
```

---

### useAutoLayout()

Automatic graph layout with 7 algorithms and smooth animations.

**Import:**
```typescript
import { useAutoLayout } from '@/hooks/useAutoLayout';
```

**Signature:**
```typescript
function useAutoLayout(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  config: UseLayoutConfig
): {
  // State
  layoutedNodes: Node<NodeData>[];
  layoutedEdges: Edge<EdgeData>[];
  isLayouting: boolean;
  lastLayoutTime: number;
  currentAlgorithm: LayoutAlgorithmType;

  // Actions
  applyLayout: (algorithm?: LayoutAlgorithmType) => void;
  resetLayout: () => void;
  fitView: () => void;

  // Utils
  canAnimate: boolean;
  layoutSupported: (algorithm: LayoutAlgorithmType) => boolean;
}
```

**Config:**
```typescript
interface UseLayoutConfig {
  algorithm: LayoutAlgorithmType;
  animated?: boolean;        // Default: true
  duration?: number;          // Default: 300ms
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // Default: 'TB'
  nodeSpacing?: number;       // Default: 50
  rankSpacing?: number;       // Default: 100
}
```

**Layout Algorithms:**
- `'dagre'` - Hierarchical (top-to-bottom)
- `'force'` - Force-directed network
- `'elk'` - Advanced hierarchical
- `'grid'` - Uniform grid
- `'circular'` - Circular layout
- `'tree'` - Strict tree hierarchy
- `'manual'` - No layout (preserve positions)

**Usage:**
```typescript
const { layoutedNodes, layoutedEdges, applyLayout } = useAutoLayout(
  nodes,
  edges,
  { algorithm: 'dagre', animated: true }
);

// Switch layout
applyLayout('force');
```

**Performance:**
- Dagre: ~35ms
- Force: ~150ms
- ELK: ~75ms
- Grid: ~5ms
- Circular: ~8ms
- Tree: ~15ms
- Manual: ~0.1ms

---

### useLayoutSelector()

Layout selector state management with keyboard shortcuts.

**Import:**
```typescript
import { useLayoutSelector } from '@/hooks/useLayoutSelector';
```

**Signature:**
```typescript
function useLayoutSelector(
  config?: LayoutSelectorConfig
): {
  selectedLayout: LayoutAlgorithmType;
  currentMetadata: LayoutMetadata;
  isOpen: boolean;
  availableLayouts: LayoutMetadata[];

  selectLayout: (algorithm: LayoutAlgorithmType) => void;
  toggleSelector: () => void;
  openSelector: () => void;
  closeSelector: () => void;
  nextLayout: () => void;
  previousLayout: () => void;
}
```

**Config:**
```typescript
interface LayoutSelectorConfig {
  defaultLayout?: LayoutAlgorithmType;
  persist?: boolean;
  storageKey?: string;
  enableKeyboardShortcuts?: boolean;
}
```

---

### useModes()

View mode filtering with 5 modes.

**Import:**
```typescript
import { useModes } from '@/hooks/useModes';
```

**Signature:**
```typescript
function useModes(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[]
): {
  currentMode: ViewMode;
  previousMode: ViewMode | null;
  setMode: (mode: ViewMode, preserveState?: boolean) => void;
  goBack: () => void;

  filteredNodes: Node<NodeData>[];
  filteredEdges: Edge<EdgeData>[];

  filterStats: {
    totalNodes: number;
    visibleNodes: number;
    hiddenNodes: number;
    totalEdges: number;
    visibleEdges: number;
    hiddenEdges: number;
  };

  modeConfig: ModeMetadata;
  allModes: Record<ViewMode, ModeMetadata>;

  canEdit: boolean;
  showsCanvas: boolean;
  hasSidebar: boolean;
}
```

**View Modes:**
- `'explorer'` - All nodes/edges
- `'composition'` - Template structure
- `'dependency'` - Dependencies only
- `'execution'` - Runtime flow
- `'validation'` - Validation results

**Usage:**
```typescript
const {
  currentMode,
  setMode,
  filteredNodes,
  filteredEdges
} = useModes(nodes, edges);

// Switch to composition mode
setMode('composition');
```

---

### useVariables()

Variable management for template parameters.

**Import:**
```typescript
import { useVariables } from '@/hooks/useVariables';
```

**Signature:**
```typescript
function useVariables(templateId: string): {
  variables: VariableDefinition[];
  values: Record<string, any>;
  errors: Record<string, string>;
  isValid: boolean;

  setValue: (name: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  resetValues: () => void;
  validateAll: () => boolean;
}
```

**Usage:**
```typescript
const { variables, values, setValue, isValid } = useVariables('code-reviewer');

<input
  value={values['codePath'] || ''}
  onChange={(e) => setValue('codePath', e.target.value)}
/>
```

---

### useZoomLevel()

Zoom level detection for adaptive rendering.

**Import:**
```typescript
import { useZoomLevel, useDetailLevel } from '@/hooks/useZoomLevel';
```

**Signature:**
```typescript
function useZoomLevel(): number;

function useDetailLevel(zoom: number): DetailLevel;
```

**Detail Levels:**
- `'minimal'` - Icon only (zoom < 0.5)
- `'compact'` - Icon + name (0.5 - 1.0)
- `'standard'` - Key details (1.0 - 1.5)
- `'full'` - All details (zoom > 1.5)

---

### useDragAndDrop()

Drag and drop from catalog to canvas.

**Import:**
```typescript
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
```

**Signature:**
```typescript
function useDragAndDrop(): {
  isDragging: boolean;
  draggedItem: any | null;
  handleDragStart: (item: any) => void;
  handleDragEnd: () => void;
  handleDrop: (position: { x: number; y: number }) => void;
}
```

---

### useNodeSelection()

Enhanced node selection with multi-select.

**Import:**
```typescript
import { useNodeSelection } from '@/hooks/useNodeSelection';
```

**Signature:**
```typescript
function useNodeSelection(): {
  selectedNodeIds: string[];
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
}
```

---

## Components

### Canvas

Main ReactFlow canvas component.

**Import:**
```typescript
import { Canvas } from '@/components/canvas/Canvas';
```

**Props:**
```typescript
interface CanvasProps {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

**Usage:**
```typescript
<Canvas
  nodes={nodes}
  edges={edges}
  onNodesChange={handleNodesChange}
  onEdgesChange={handleEdgesChange}
/>
```

---

### ModeSelector

View mode selector tabs.

**Import:**
```typescript
import { ModeSelector } from '@/components/modes/ModeSelector';
```

**Props:**
```typescript
interface ModeSelectorProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  showDescriptions?: boolean;  // Default: true
  showShortcuts?: boolean;     // Default: true
  className?: string;
  style?: React.CSSProperties;
}
```

**Usage:**
```typescript
<ModeSelector
  currentMode={currentMode}
  onModeChange={setMode}
  showDescriptions={true}
  showShortcuts={true}
/>
```

---

### LayoutSelector

Layout algorithm selector modal.

**Import:**
```typescript
import { LayoutSelector } from '@/components/canvas/LayoutSelector';
```

**Props:**
```typescript
interface LayoutSelectorProps {
  currentLayout: LayoutAlgorithmType;
  onLayoutChange: (algorithm: LayoutAlgorithmType) => void;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}
```

**Usage:**
```typescript
<LayoutSelector
  currentLayout={currentAlgorithm}
  onLayoutChange={applyLayout}
/>
```

---

### VariablePanel

Variable editing slide-out panel.

**Import:**
```typescript
import { VariablePanel } from '@/components/variables/VariablePanel';
```

**Props:**
```typescript
interface VariablePanelProps {
  templateId: string;
  templateName: string;
  onClose: () => void;
  className?: string;
}
```

**Usage:**
```typescript
<VariablePanel
  templateId="code-reviewer"
  templateName="Code Reviewer"
  onClose={() => setShowVariables(false)}
/>
```

---

### Node Components

#### TemplateNode

Agent template node (blue, 200x150px).

**Props:**
```typescript
interface TemplateNodeProps {
  id: string;
  data: TemplateNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}
```

---

#### FragmentNode

Prompt fragment node (green, 150x100px, rounded).

**Props:**
```typescript
interface FragmentNodeProps {
  id: string;
  data: FragmentNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}
```

---

#### VariableNode

Variable node (yellow, 100x80px, diamond).

**Props:**
```typescript
interface VariableNodeProps {
  id: string;
  data: VariableNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}
```

---

#### ToolConfigNode

Tool configuration node (teal, 150x120px, hexagon).

**Props:**
```typescript
interface ToolConfigNodeProps {
  id: string;
  data: ToolConfigNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}
```

---

#### BundleNode

Tool bundle container node (purple).

**Props:**
```typescript
interface BundleNodeProps {
  id: string;
  data: BundleNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}
```

---

#### ResolvedNode

Final resolved configuration node (gray, 200x150px).

**Props:**
```typescript
interface ResolvedNodeProps {
  id: string;
  data: ResolvedNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}
```

---

### Edge Components

#### CustomEdge

Type-based edge with animations.

**Props:**
```typescript
interface CustomEdgeProps {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: EdgeData;
  selected?: boolean;
  animated?: boolean;
}
```

**Edge Types:**
- `extends` - Purple, 3px, solid
- `mixin` - Green, 2px, dashed
- `variable` - Yellow, 1px, dotted
- `toolRef` - Blue, 1px, solid
- `bundle` - Purple, 2px, solid
- `composition` - Blue, 2px, solid

---

### Utility Components

#### LoadingOverlay

Loading state with error handling.

**Props:**
```typescript
interface LoadingOverlayProps {
  isLoading: boolean;
  error?: string | null;
  message?: string;
  onRetry?: () => void;
}
```

---

#### ErrorBoundary

React error boundary.

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

---

## Types

### Core Types

```typescript
// View modes
type ViewMode =
  | 'explorer'
  | 'composition'
  | 'dependency'
  | 'execution'
  | 'validation';

// Layout algorithms
type LayoutAlgorithmType =
  | 'dagre'
  | 'force'
  | 'elk'
  | 'grid'
  | 'circular'
  | 'tree'
  | 'manual';

// Detail levels
type DetailLevel =
  | 'minimal'
  | 'compact'
  | 'standard'
  | 'full';

// Variable types
enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object',
  FILE_PATH = 'file_path',
  DIRECTORY_PATH = 'directory_path',
  URL = 'url',
  EMAIL = 'email',
  DATE = 'date',
  JSON = 'json',
}
```

### Node Data Types

```typescript
interface NodeData {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, any>;
  config?: Record<string, any>;
}

interface TemplateNodeData extends NodeData {
  type: 'template';
  description?: string;
  tags?: string[];
  tools?: string[];
  version?: string;
  extends?: string;
  mixins?: string[];
}

interface VariableNodeData extends NodeData {
  type: 'variable';
  variableType: VariableType;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  validation?: any;
}

interface ToolConfigNodeData extends NodeData {
  type: 'toolConfig';
  permissions?: string[];
  rules?: any[];
}
```

### Edge Data Types

```typescript
interface EdgeData {
  id: string;
  type: EdgeType;
  label?: string;
  metadata?: Record<string, any>;
}

type EdgeType =
  | 'extends'
  | 'mixin'
  | 'variable'
  | 'toolRef'
  | 'bundle'
  | 'composition';
```

### Template Types

```typescript
interface AgentTemplate {
  metadata: {
    name: string;
    description?: string;
    version?: string;
    tags?: string[];
  };
  agent: {
    description: string;
    prompt: string;
    tools: string[];
  };
  extends?: string;
  mixins?: string[];
  variables?: Record<string, VariableDefinition>;
}

interface VariableDefinition {
  name: string;
  label: string;
  type: VariableType;
  description?: string;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  validation?: any;
}
```

---

## Utilities

### Conversion Functions

```typescript
import { convertTemplateToReactFlow } from '@/lib/converters/templateToReactFlow';

interface TemplateConversionResult {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  variables: VariableDefinition[];
  metadata: ConversionMetadata;
}

function convertTemplateToReactFlow(
  template: AgentTemplate,
  options?: ConversionOptions
): TemplateConversionResult;
```

### Layout Functions

```typescript
import { applyLayout } from '@/lib/layout/algorithms';

function applyLayout(
  nodes: Node[],
  edges: Edge[],
  algorithm: LayoutAlgorithmType,
  config?: LayoutConfig
): { nodes: Node[]; edges: Edge[] };
```

### Mode Filters

```typescript
import { applyModeFilters } from '@/lib/modes/filters';

function applyModeFilters(
  nodes: Node[],
  edges: Edge[],
  mode: ViewMode
): { nodes: Node[]; edges: Edge[]; stats: FilterStats };
```

### Variable Validation

```typescript
import { validateVariable } from '@/lib/variables/validation';

function validateVariable(
  value: any,
  definition: VariableDefinition
): { valid: boolean; error?: string };
```

---

## Store

### Canvas Store

```typescript
import { useCanvasStore } from '@/store';

interface CanvasState {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: Viewport;
  history: HistoryState[];
  historyIndex: number;

  // Actions
  addNode: (node: Node<NodeData>) => void;
  updateNode: (id: string, updates: Partial<Node<NodeData>>) => void;
  removeNode: (id: string) => void;
  // ... more actions
}
```

---

## Examples

### Complete Integration

```typescript
import { useCanvas, useAutoLayout, useModes } from '@/hooks';
import { Canvas, ModeSelector, LayoutSelector } from '@/components';
import { convertTemplateToReactFlow } from '@/lib/converters';

function App() {
  const [template, setTemplate] = useState<AgentTemplate | null>(null);

  // Convert template
  const result = useMemo(
    () => template ? convertTemplateToReactFlow(template) : null,
    [template]
  );

  // Canvas state
  const { nodes, edges, setNodes, setEdges } = useCanvas();

  // Auto layout
  const { layoutedNodes, layoutedEdges, applyLayout, currentAlgorithm } =
    useAutoLayout(nodes, edges, { algorithm: 'dagre' });

  // View modes
  const { currentMode, setMode, filteredNodes, filteredEdges } =
    useModes(layoutedNodes, layoutedEdges);

  // Load template
  useEffect(() => {
    if (result) {
      setNodes(result.nodes);
      setEdges(result.edges);
    }
  }, [result]);

  return (
    <>
      <ModeSelector currentMode={currentMode} onModeChange={setMode} />
      <LayoutSelector currentLayout={currentAlgorithm} onLayoutChange={applyLayout} />
      <Canvas nodes={filteredNodes} edges={filteredEdges} />
    </>
  );
}
```

---

## Version History

**v1.0.0** (November 10, 2025)
- Initial API release
- Complete hook and component documentation
- Type definitions
- Usage examples

---

**Generated:** November 10, 2025
**Version:** 1.0.0
**Author:** Wave 3 Agent 4 - Documentation & Testing Engineer
