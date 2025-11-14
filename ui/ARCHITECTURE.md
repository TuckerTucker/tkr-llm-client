# ReactFlow Template UI - Architecture

**Version:** 1.0.0
**Last Updated:** November 10, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Key Patterns](#key-patterns)
8. [Performance Considerations](#performance-considerations)
9. [Extension Points](#extension-points)

---

## Overview

The ReactFlow Template UI is a React-based visualization system for agent templates. It provides an interactive canvas for exploring, editing, and understanding complex template structures.

### Design Goals

1. **Modularity:** Components and hooks are self-contained and reusable
2. **Performance:** Efficient rendering for graphs with 100+ nodes
3. **Extensibility:** Easy to add new features without breaking existing code
4. **Type Safety:** Full TypeScript coverage with strict mode
5. **User Experience:** Intuitive interface with keyboard shortcuts

### Architecture Pattern

The system follows an **Inversion of Control (IoC)** design:

- Dependencies injected through props/hooks
- Business logic separated from presentation
- Testable components via dependency injection
- Framework-agnostic core logic

---

## Technology Stack

### Core

- **React** 18.2.0 - UI framework
- **TypeScript** 5.3.0 - Type safety
- **ReactFlow** 11.10.0 - Graph visualization
- **Zustand** 4.4.0 - State management

### Layout & Visualization

- **@dagrejs/dagre** 1.1.8 - Hierarchical layout
- **d3-force** 3.0.0 - Force-directed layout
- **elkjs** 0.11.0 - Advanced hierarchical layout

### Build & Development

- **Vite** 5.0.0 - Build tool
- **Vitest** (future) - Testing framework

### Data Serialization

- **js-yaml** 4.1.0 - YAML parsing/serialization (future export feature)

---

## Directory Structure

```
ui/
├── src/
│   ├── components/          # React components
│   │   ├── canvas/          # Canvas and controls
│   │   │   ├── Canvas.tsx
│   │   │   ├── Controls.tsx
│   │   │   ├── LayoutSelector.tsx
│   │   │   ├── NodeDetails.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   └── index.ts
│   │   ├── catalog/         # Template catalog (from backend)
│   │   ├── nodes/           # Node components
│   │   │   ├── BaseNode.tsx
│   │   │   ├── TemplateNode.tsx
│   │   │   ├── FragmentNode.tsx
│   │   │   ├── VariableNode.tsx
│   │   │   ├── ToolConfigNode.tsx
│   │   │   ├── BundleNode.tsx
│   │   │   ├── ResolvedNode.tsx
│   │   │   ├── NodeHandle.tsx
│   │   │   ├── styles.ts
│   │   │   └── enhancements/
│   │   │       └── ZoomAdaptive.tsx
│   │   ├── edges/           # Edge components
│   │   │   ├── CustomEdge.tsx
│   │   │   └── index.ts
│   │   ├── modes/           # View mode components
│   │   │   ├── ModeSelector.tsx
│   │   │   └── index.ts
│   │   ├── variables/       # Variable panel
│   │   │   ├── VariablePanel.tsx
│   │   │   ├── VariableInput.tsx
│   │   │   └── inputs/
│   │   │       ├── StringInput.tsx
│   │   │       ├── NumberInput.tsx
│   │   │       ├── BooleanInput.tsx
│   │   │       ├── ArrayInput.tsx
│   │   │       ├── ObjectInput.tsx
│   │   │       ├── FilePathInput.tsx
│   │   │       ├── UrlInput.tsx
│   │   │       ├── EmailInput.tsx
│   │   │       ├── DateInput.tsx
│   │   │       └── index.ts
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── index.ts
│   ├── hooks/               # React hooks
│   │   ├── useCanvas.ts
│   │   ├── useAutoLayout.ts
│   │   ├── useLayoutSelector.ts
│   │   ├── useModes.ts
│   │   ├── useVariables.ts
│   │   ├── useZoomLevel.ts
│   │   ├── useDragAndDrop.ts
│   │   ├── useNodeSelection.ts
│   │   ├── __tests__/
│   │   │   └── useAutoLayout.test.ts
│   │   └── index.ts
│   ├── lib/                 # Business logic
│   │   ├── converters/      # Template → ReactFlow
│   │   │   └── templateToReactFlow.ts
│   │   ├── layout/          # Layout algorithms (future)
│   │   ├── modes/           # View mode logic
│   │   │   ├── metadata.ts
│   │   │   ├── filters.ts
│   │   │   └── index.ts
│   │   ├── variables/       # Variable logic
│   │   │   └── validation.ts
│   │   ├── utils/           # Utilities
│   │   │   └── nodePositioning.ts
│   │   ├── types/           # Type definitions
│   │   │   ├── ui-types.ts
│   │   │   ├── variable-types.ts
│   │   │   └── index.ts
│   │   └── styles/          # Style utilities
│   │       ├── edgeStyles.tsx
│   │       └── index.ts
│   ├── store/               # Zustand stores
│   │   └── index.ts
│   ├── examples/            # Example apps
│   │   ├── AppWithHistory.tsx
│   │   └── LayoutExample.tsx
│   ├── __tests__/           # Integration tests
│   │   └── store-integration.test.ts
│   ├── App.tsx              # Main app
│   └── main.tsx             # Entry point
├── docs/                    # Documentation
│   ├── MODE_SYSTEM.md
│   ├── MODE_QUICK_REF.md
│   └── WAVE2_MODE_IMPLEMENTATION.md
├── USER_GUIDE.md            # User documentation
├── API.md                   # API documentation
├── ARCHITECTURE.md          # This file
├── CONTRIBUTING.md          # Contributing guide
├── CHANGELOG.md             # Version history
├── README.md                # Project overview
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## Data Flow

### High-Level Flow

```
┌─────────────────┐
│  AgentTemplate  │ (Backend data structure)
│   (YAML/JSON)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Template        │ (Conversion layer)
│ Converter       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ReactFlow       │ (Graph structure)
│ Nodes + Edges   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Layout Engine   │ (Positioning)
│ (Dagre/Force)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Mode       │ (Filtering)
│ Filter          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Canvas          │ (Rendering)
│ (ReactFlow)     │
└─────────────────┘
```

### Detailed Flow

```typescript
// 1. User selects template
const template: AgentTemplate = await loadTemplate('code-reviewer');

// 2. Convert to ReactFlow format
const result = convertTemplateToReactFlow(template);
// → { nodes: Node[], edges: Edge[], variables: VariableDefinition[] }

// 3. Apply layout
const { layoutedNodes, layoutedEdges } = useAutoLayout(
  result.nodes,
  result.edges,
  { algorithm: 'dagre' }
);

// 4. Apply view mode filter
const { filteredNodes, filteredEdges } = useModes(
  layoutedNodes,
  layoutedEdges
);

// 5. Render on canvas
<Canvas nodes={filteredNodes} edges={filteredEdges} />
```

### Event Flow

```
User Action (click, drag, key press)
  ↓
Event Handler (React component)
  ↓
Hook/Store Action (useCanvas, useModes, etc.)
  ↓
State Update (Zustand store)
  ↓
Component Re-render (React)
  ↓
Visual Update (ReactFlow)
```

---

## State Management

### Zustand Stores

The UI uses Zustand for global state management with three main stores:

#### 1. Canvas Store (from backend)

**Location:** `src/lib/state/canvas-store.ts`

**Responsibilities:**
- Node and edge state
- Selection state
- Viewport state
- History (undo/redo) with 50-state limit

**Access:**
```typescript
import { useCanvasStore } from '@/store';

const nodes = useCanvasStore(state => state.nodes);
const addNode = useCanvasStore(state => state.addNode);
```

**Features:**
- Automatic history tracking
- Undo/redo with keyboard shortcuts
- Selection management
- Viewport persistence

---

#### 2. Mode Store (from backend)

**Location:** `src/lib/modes/mode-store.ts`

**Responsibilities:**
- Current view mode
- Mode-specific state (filters, settings)
- Mode history
- localStorage persistence

**Access:**
```typescript
import { useModeStore } from '@backend/lib/modes/mode-store';

const currentMode = useModeStore(state => state.currentMode);
const setMode = useModeStore(state => state.setMode);
```

**Features:**
- 5 view modes (explorer, composition, dependency, execution, validation)
- Mode-specific state preservation
- Keyboard shortcuts (1-5)
- localStorage persistence

---

#### 3. Variable Store (from backend)

**Location:** `src/lib/variables/variable-store.ts`

**Responsibilities:**
- Variable definitions per template
- Variable values
- Validation errors
- Form state

**Access:**
```typescript
import { useVariableStore } from '@backend/lib/variables/variable-store';

const variables = useVariableStore(state => state.variables);
const setValue = useVariableStore(state => state.setValue);
```

---

### React State

Local component state uses React hooks:

```typescript
// Local UI state
const [isOpen, setIsOpen] = useState(false);
const [selectedTab, setSelectedTab] = useState(0);

// Refs for imperative APIs
const canvasRef = useRef<HTMLDivElement>(null);

// Memoized computations
const sortedNodes = useMemo(
  () => nodes.sort((a, b) => a.position.y - b.position.y),
  [nodes]
);

// Side effects
useEffect(() => {
  document.title = `Template: ${template.name}`;
}, [template]);
```

---

## Component Architecture

### Component Hierarchy

```
App.tsx
├── TemplateCatalog (from backend)
│   └── TemplateCard
├── Canvas
│   ├── ReactFlow
│   │   ├── TemplateNode
│   │   ├── FragmentNode
│   │   ├── VariableNode
│   │   ├── ToolConfigNode
│   │   ├── BundleNode
│   │   ├── ResolvedNode
│   │   └── CustomEdge
│   ├── Controls
│   ├── LayoutSelector
│   ├── NodeDetails
│   └── ContextMenu
├── ModeSelector
├── VariablePanel
│   └── VariableInput
│       ├── StringInput
│       ├── NumberInput
│       ├── BooleanInput
│       ├── ArrayInput
│       ├── ObjectInput
│       ├── FilePathInput
│       ├── UrlInput
│       ├── EmailInput
│       └── DateInput
├── UndoRedoControls (from backend)
├── LoadingOverlay
└── ErrorBoundary
```

### Component Categories

#### 1. Container Components

**Responsibility:** Logic and state management

**Examples:**
- `App.tsx` - Main application logic
- `Canvas.tsx` - Canvas orchestration
- `VariablePanel.tsx` - Variable management

**Pattern:**
```typescript
function Container() {
  // State management
  const { state, actions } = useCustomHook();

  // Business logic
  const handleAction = () => {
    // ...
  };

  // Render presentation component
  return <Presentation data={state} onAction={handleAction} />;
}
```

---

#### 2. Presentation Components

**Responsibility:** Visual rendering only

**Examples:**
- `TemplateNode.tsx` - Node visualization
- `ModeSelector.tsx` - Mode tabs UI
- `LoadingOverlay.tsx` - Loading indicator

**Pattern:**
```typescript
interface PresentationProps {
  data: DataType;
  onAction: (id: string) => void;
  className?: string;
}

function Presentation({ data, onAction, className }: PresentationProps) {
  return (
    <div className={className}>
      {/* Pure rendering logic */}
    </div>
  );
}
```

---

#### 3. Hook Components

**Responsibility:** Reusable logic

**Examples:**
- `useAutoLayout` - Layout computation
- `useModes` - View mode filtering
- `useVariables` - Variable management

**Pattern:**
```typescript
function useCustomHook(input: InputType) {
  const [state, setState] = useState(initialState);

  const action = useCallback(() => {
    // Logic
  }, [dependencies]);

  return { state, action };
}
```

---

### Node Component Structure

All node components extend `BaseNode`:

```typescript
// BaseNode.tsx
interface BaseNodeProps<T> {
  id: string;
  data: T;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

function BaseNode<T extends NodeData>(props: BaseNodeProps<T>) {
  const detailLevel = useDetailLevel(props.zoomLevel || 1);

  return (
    <div className={cn('node', props.data.type, {
      selected: props.selected,
      dragging: props.dragging
    })}>
      {/* Adaptive rendering based on zoom */}
      {detailLevel === 'minimal' && <MinimalView />}
      {detailLevel === 'compact' && <CompactView />}
      {detailLevel === 'standard' && <StandardView />}
      {detailLevel === 'full' && <FullView />}
    </div>
  );
}
```

**Zoom Adaptation:**
- < 0.5: Minimal (icon only)
- 0.5-1.0: Compact (icon + name)
- 1.0-1.5: Standard (key details)
- \> 1.5: Full (all details)

---

## Key Patterns

### 1. Inversion of Control (IoC)

**Problem:** Hard-coded dependencies make testing and reuse difficult

**Solution:** Inject dependencies through props/hooks

```typescript
// ❌ Bad: Hard-coded dependency
function Component() {
  const data = fetchDataDirectly();
  return <div>{data}</div>;
}

// ✅ Good: Dependency injection
function Component({ data }: { data: DataType }) {
  return <div>{data}</div>;
}
```

---

### 2. Render Props Pattern

**Problem:** Sharing logic between components

**Solution:** Pass rendering function as prop

```typescript
function DataProvider({ children, render }: {
  children?: (data: Data) => React.ReactNode;
  render?: (data: Data) => React.ReactNode;
}) {
  const data = useData();
  return <>{children ? children(data) : render?.(data)}</>;
}

// Usage
<DataProvider>
  {(data) => <Display data={data} />}
</DataProvider>
```

---

### 3. Compound Components

**Problem:** Complex component APIs with many props

**Solution:** Component composition with shared context

```typescript
const LayoutSelector = {
  Root: LayoutSelectorRoot,
  Trigger: LayoutSelectorTrigger,
  Content: LayoutSelectorContent,
  Item: LayoutSelectorItem,
};

// Usage
<LayoutSelector.Root>
  <LayoutSelector.Trigger />
  <LayoutSelector.Content>
    <LayoutSelector.Item value="dagre" />
    <LayoutSelector.Item value="force" />
  </LayoutSelector.Content>
</LayoutSelector.Root>
```

---

### 4. Optimistic UI Updates

**Problem:** Waiting for async operations feels slow

**Solution:** Update UI immediately, rollback on error

```typescript
function handleDelete(nodeId: string) {
  // 1. Optimistic update
  removeNode(nodeId);

  // 2. Async operation
  deleteNodeAsync(nodeId)
    .catch(() => {
      // 3. Rollback on error
      undo();
      showError('Delete failed');
    });
}
```

---

### 5. Error Boundaries

**Problem:** Errors crash entire app

**Solution:** Catch errors at component boundaries

```typescript
<ErrorBoundary fallback={<ErrorScreen />}>
  <Canvas />
</ErrorBoundary>
```

---

### 6. Memoization for Performance

**Problem:** Expensive computations run on every render

**Solution:** Memoize with useMemo/useCallback

```typescript
// Memoize expensive computation
const filteredNodes = useMemo(
  () => nodes.filter(node => matchesFilter(node, filter)),
  [nodes, filter]
);

// Memoize callback
const handleClick = useCallback(
  (id: string) => {
    selectNode(id);
  },
  [selectNode]
);
```

---

## Performance Considerations

### 1. Rendering Optimization

**Techniques:**
- React.memo for pure components
- useMemo for expensive computations
- useCallback for stable function references
- Virtual scrolling for large lists (future)

**Targets:**
- Render time: < 16ms per frame (60fps)
- Layout calculation: < 50ms for 50 nodes
- Mode switching: < 100ms
- Variable validation: < 50ms

---

### 2. State Updates

**Batch updates:**
```typescript
// ❌ Bad: Multiple re-renders
setNodes(newNodes);
setEdges(newEdges);
setSelection(newSelection);

// ✅ Good: Single re-render
batch(() => {
  setNodes(newNodes);
  setEdges(newEdges);
  setSelection(newSelection);
});
```

**Zustand automatic batching:**
```typescript
// Zustand batches within same function
const updateGraph = () => {
  addNode(node1);  // No re-render
  addNode(node2);  // No re-render
  addEdge(edge1);  // Single re-render
};
```

---

### 3. Animation Performance

**Automatic disabling:**
```typescript
// Auto-disable animations for large graphs
const canAnimate = nodes.length <= 100;

useAutoLayout(nodes, edges, {
  algorithm: 'dagre',
  animated: canAnimate  // Only animate small graphs
});
```

---

### 4. Memory Management

**History limits:**
```typescript
// Canvas store maintains max 50 history states
const MAX_HISTORY = 50;

function pushHistory(state: CanvasState) {
  const history = [...store.history, state];
  if (history.length > MAX_HISTORY) {
    history.shift(); // Remove oldest
  }
  store.history = history;
}
```

---

## Extension Points

### 1. Adding New View Modes

**Steps:**

1. Add mode type:
```typescript
// src/lib/modes/types.ts
type ViewMode =
  | 'explorer'
  | 'composition'
  | 'dependency'
  | 'execution'
  | 'validation'
  | 'custom';  // ← New mode
```

2. Add metadata:
```typescript
// src/lib/modes/metadata.ts
export const MODE_METADATA: Record<ViewMode, ModeMetadata> = {
  // ...existing modes
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Custom view mode',
    icon: '⚙️',
    shortcut: '6',
    supportsEditing: true,
    showsCanvas: true,
  },
};
```

3. Add filter logic:
```typescript
// src/lib/modes/filters.ts
function filterCustomMode(nodes, edges) {
  // Custom filtering logic
  return { nodes, edges };
}
```

---

### 2. Adding New Layout Algorithms

**Steps:**

1. Implement algorithm:
```typescript
// src/lib/layout/algorithms/custom.ts
export function customLayout(nodes, edges, config) {
  // Layout logic
  return { nodes, edges };
}
```

2. Register:
```typescript
// src/lib/layout/algorithms.ts
export const LAYOUT_ALGORITHMS = {
  dagre: dagreLayout,
  force: forceLayout,
  custom: customLayout,  // ← New layout
};
```

3. Add metadata:
```typescript
// src/hooks/useLayoutSelector.ts
export const LAYOUT_OPTIONS = [
  // ...existing layouts
  {
    id: 'custom',
    name: 'Custom Layout',
    icon: '⚡',
    description: 'Custom algorithm',
  },
];
```

---

### 3. Adding New Variable Types

**Steps:**

1. Add type enum:
```typescript
// Variable types
enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  // ...
  CUSTOM = 'custom',  // ← New type
}
```

2. Create input component:
```typescript
// src/components/variables/inputs/CustomInput.tsx
export function CustomInput({ value, onChange }: CustomInputProps) {
  return (
    <input
      type="custom"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

3. Register:
```typescript
// src/components/variables/VariableInput.tsx
const INPUT_COMPONENTS = {
  string: StringInput,
  number: NumberInput,
  custom: CustomInput,  // ← New input
};
```

---

### 4. Adding New Node Types

See CONTRIBUTING.md for complete guide.

---

## Testing Strategy

### Unit Tests

**Coverage:**
- Hooks (useAutoLayout, useModes, etc.)
- Utilities (converters, validators)
- Pure functions (filters, transformers)

**Framework:** Vitest (future)

---

### Integration Tests

**Coverage:**
- Complete workflows (template load → render)
- View mode switching
- Layout application
- Variable editing
- Undo/redo

**Location:** `ui/src/__tests__/integration/`

---

### E2E Tests

**Coverage:**
- User journeys
- Keyboard shortcuts
- Error scenarios
- Performance benchmarks

**Framework:** Playwright/Cypress (future)

---

## Build & Deployment

### Development

```bash
npm run dev        # Start dev server
npm run type-check # TypeScript check
```

### Production

```bash
npm run build      # Build for production
npm run preview    # Preview production build
```

### Output

```
ui/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── [static assets]
```

---

## Future Enhancements

### Planned Features

1. **Export System** - YAML/JSON/Markdown export
2. **Import System** - Load templates from files
3. **Template Validation** - Real-time validation feedback
4. **Collaborative Editing** - Multi-user support
5. **Custom Themes** - Dark mode, color schemes
6. **Plugin System** - Third-party extensions
7. **Performance Profiler** - Built-in performance monitoring

---

## Related Documentation

- [USER_GUIDE.md](./USER_GUIDE.md) - User documentation
- [API.md](./API.md) - API reference
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guide
- [CHANGELOG.md](./CHANGELOG.md) - Version history

---

**Generated:** November 10, 2025
**Version:** 1.0.0
**Author:** Wave 3 Agent 4 - Documentation & Testing Engineer
