# View Mode System - Quick Reference

## Mode Overview

| Mode | Icon | Key | Purpose | Nodes | Edges | Edit |
|------|------|-----|---------|-------|-------|------|
| **Explorer** | 🔍 | `1` | Browse everything | All | All | ✅ |
| **Composition** | 🧩 | `2` | Template structure | Template, Fragment, Bundle | Extends, Mixin | ✅ |
| **Dependency** | 🔗 | `3` | Dependencies | Template, Fragment | Extends, Mixin | ❌ |
| **Execution** | ▶️ | `4` | Runtime flow | All + Variables | All + Execution | ✅ |
| **Validation** | ✓ | `5` | Errors & warnings | With issues | Between visible | ❌ |

## Quick Start

### Basic Usage

```typescript
import { useModes } from '@/hooks/useModes';
import { ModeSelector } from '@/components/modes/ModeSelector';

function MyComponent() {
  const [nodes, setNodes] = useState([...]);
  const [edges, setEdges] = useState([...]);

  const {
    currentMode,
    setMode,
    filteredNodes,
    filteredEdges,
    filterStats,
  } = useModes(nodes, edges);

  return (
    <>
      <ModeSelector
        currentMode={currentMode}
        onModeChange={setMode}
      />
      <Canvas
        nodes={filteredNodes}
        edges={filteredEdges}
      />
      <Stats>
        {filterStats.visibleNodes} / {filterStats.totalNodes} nodes
      </Stats>
    </>
  );
}
```

## Keyboard Shortcuts

Press number keys to switch modes:
- `1` → Explorer
- `2` → Composition
- `3` → Dependency
- `4` → Execution
- `5` → Validation

**Note:** Shortcuts disabled when typing in input fields.

## Mode Descriptions

### Explorer Mode (Default)
- Shows **everything**
- Best for: General exploration, getting started
- Node Types: All (Template, Fragment, Variable, Tool, Bundle, Resolved)
- Edge Types: All (Extends, Mixin, Variable, ToolRef, Composition)

### Composition Mode
- Shows **template structure**
- Best for: Understanding how templates are built
- Node Types: Template, Fragment, Bundle, Resolved
- Edge Types: Extends, Mixin, Composition
- Hides: Variables, Tool details

### Dependency Mode
- Shows **template relationships**
- Best for: Understanding inheritance and dependencies
- Node Types: Template, Fragment, Bundle
- Edge Types: Extends, Mixin only
- Read-only (no editing)

### Execution Mode
- Shows **runtime flow**
- Best for: Understanding how templates execute
- Node Types: All, with emphasis on Variables
- Edge Types: All, with emphasis on execution flow
- Highlights: Variable usage, Tool invocations

### Validation Mode
- Shows **validation results**
- Best for: Debugging errors and warnings
- Node Types: Nodes with validation issues (or all if valid)
- Edge Types: Between visible nodes
- Read-only (no editing)

## API Cheatsheet

### useModes Hook

```typescript
const {
  // Mode state
  currentMode: ViewMode;
  previousMode: ViewMode | null;

  // Actions
  setMode: (mode: ViewMode, preserveState?: boolean) => void;
  goBack: () => void;

  // Filtered data
  filteredNodes: Node[];
  filteredEdges: Edge[];

  // Metadata
  filterStats: {
    totalNodes: number;
    visibleNodes: number;
    hiddenNodes: number;
    totalEdges: number;
    visibleEdges: number;
    hiddenEdges: number;
  };
  modeConfig: ModeMetadata;

  // Capabilities
  canEdit: boolean;
  showsCanvas: boolean;
  hasSidebar: boolean;
} = useModes(nodes, edges);
```

### ModeSelector Props

```typescript
<ModeSelector
  currentMode={currentMode}          // required
  onModeChange={(mode) => {...}}     // required
  showDescriptions={true}             // optional, default: true
  showShortcuts={true}                // optional, default: true
  className="custom-class"            // optional
  style={{ ... }}                     // optional
/>
```

### Mode Metadata

```typescript
import {
  MODE_METADATA,
  getModeMetadata,
  getModeName,
  getModeIcon,
  getModeDescription,
} from '@/lib/modes/metadata';

// Get all metadata
const meta = MODE_METADATA['composition'];

// Or use helpers
const name = getModeName('composition');        // "Composition"
const icon = getModeIcon('composition');        // "🧩"
const desc = getModeDescription('composition'); // "Focus on..."
```

### Filter Functions

```typescript
import { applyModeFilters } from '@/lib/modes/filters';

const result = applyModeFilters(nodes, edges, 'composition');
// Returns: { nodes, edges, stats }
```

## Common Patterns

### Conditional Rendering Based on Mode

```typescript
const { currentMode, canEdit } = useModes(nodes, edges);

return (
  <>
    {canEdit && <EditButton />}
    {currentMode === 'validation' && <ErrorPanel />}
    {currentMode === 'execution' && <VariableForm />}
  </>
);
```

### Mode-Specific Actions

```typescript
const { currentMode } = useModes(nodes, edges);

const handleNodeClick = (node) => {
  switch (currentMode) {
    case 'composition':
      showStructureDetails(node);
      break;
    case 'dependency':
      showDependencyTree(node);
      break;
    case 'validation':
      showValidationErrors(node);
      break;
    default:
      showNodeDetails(node);
  }
};
```

### Programmatic Mode Switching

```typescript
const { setMode } = useModes(nodes, edges);

// Switch to validation mode when errors occur
useEffect(() => {
  if (hasErrors) {
    setMode('validation');
  }
}, [hasErrors, setMode]);
```

## Storage

Mode state is automatically persisted to localStorage:

**Key:** `tkr-llm-ui-mode-state`

**Stored Data:**
- Current mode
- Mode-specific state (filters, selections)
- Mode history (last 20 transitions)

**Clear Storage:**
```javascript
localStorage.removeItem('tkr-llm-ui-mode-state');
```

## Troubleshooting

### Mode Not Switching
- Check if input field has focus
- Verify keyboard event listener is registered
- Check console for errors

### Nodes Not Filtering
- Verify `node.type` property is set
- Check filter logic for the specific mode
- Ensure nodes are passed to useModes

### State Not Persisting
- Check localStorage is enabled
- Verify storage quota not exceeded
- Check browser privacy settings

## Performance Tips

1. **Memoization:** useModes already memoizes filter results
2. **Large Graphs:** All filters are O(n) complexity
3. **Frequent Updates:** Mode changes don't trigger re-filtering unless nodes/edges change
4. **Bundle Size:** Tree-shakeable exports minimize impact

## TypeScript Types

```typescript
import type {
  ViewMode,
  ModeMetadata,
  UseModesReturn,
  FilterResult,
} from '@/lib/modes';

type ViewMode =
  | 'explorer'
  | 'composition'
  | 'dependency'
  | 'execution'
  | 'validation';
```

## Resources

- **Full Documentation:** `/ui/docs/MODE_SYSTEM.md`
- **Implementation Summary:** `/ui/docs/WAVE2_MODE_IMPLEMENTATION.md`
- **Backend Types:** `/src/lib/modes/types.ts`
- **Backend Store:** `/src/lib/modes/mode-store.ts`

---

**Version:** 1.0.0
**Last Updated:** November 10, 2025
**Author:** Agent 1 (View Mode Engineer)
