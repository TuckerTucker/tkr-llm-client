# View Mode System Documentation

## Overview

The View Mode System provides 5 different perspectives on the template graph, each optimized for specific tasks. This system was implemented in Wave 2 of the UI Integration by Agent 1 (View Mode Engineer).

## Architecture

### Components Structure

```
ui/src/
├── components/modes/
│   ├── ModeSelector.tsx      # Tab interface for mode switching
│   └── index.ts
├── hooks/
│   └── useModes.ts           # React hook for mode state & filtering
├── lib/modes/
│   ├── metadata.ts           # Mode configuration and icons
│   ├── filters.ts            # Node/edge filtering logic
│   └── index.ts
└── App.tsx                   # Integration point
```

### Backend Integration

The mode system leverages backend infrastructure:

```
src/lib/modes/
├── types.ts                  # ViewMode type and state interfaces
└── mode-store.ts            # Zustand store with localStorage persistence
```

## 5 View Modes

### 1. Explorer Mode (Default)
- **Icon:** 🔍
- **Shortcut:** `1`
- **Purpose:** General exploration and browsing
- **Visibility:** All nodes and all edges
- **Layout:** Dagre (hierarchical)
- **Editing:** Enabled

### 2. Composition Mode
- **Icon:** 🧩
- **Shortcut:** `2`
- **Purpose:** Understanding template structure and composition
- **Visibility:**
  - Nodes: Template, Fragment, Bundle, Resolved
  - Edges: Extends, Mixin, Composition
- **Layout:** Tree
- **Editing:** Enabled

### 3. Dependency Mode
- **Icon:** 🔗
- **Shortcut:** `3`
- **Purpose:** Visualizing template dependencies
- **Visibility:**
  - Nodes: Template, Bundle, Fragment
  - Edges: Extends, Mixin
- **Layout:** Force-directed
- **Editing:** Disabled (read-only)

### 4. Execution Mode
- **Icon:** ▶️
- **Shortcut:** `4`
- **Purpose:** Understanding runtime flow and variable usage
- **Visibility:** All nodes with emphasis on variables and tools
- **Layout:** Dagre (left-to-right)
- **Editing:** Enabled

### 5. Validation Mode
- **Icon:** ✓
- **Shortcut:** `5`
- **Purpose:** Reviewing validation results and errors
- **Visibility:** Nodes with validation issues (or all if no issues)
- **Layout:** Grid
- **Editing:** Disabled (read-only)

## Usage

### Basic Integration

```typescript
import { useModes } from '@/hooks/useModes';
import { ModeSelector } from '@/components/modes/ModeSelector';

function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const {
    currentMode,
    setMode,
    filteredNodes,
    filteredEdges,
    filterStats,
    modeConfig,
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
    </>
  );
}
```

### Keyboard Shortcuts

Users can press keys `1-5` to switch modes:
- `1` = Explorer
- `2` = Composition
- `3` = Dependency
- `4` = Execution
- `5` = Validation

Shortcuts only work when no input/textarea is focused.

### Mode Persistence

Mode state is automatically persisted to localStorage:
- Current mode
- Mode-specific state (filters, selections, etc.)
- Mode history (last 20 transitions)

Storage key: `tkr-llm-ui-mode-state`

## API Reference

### `useModes(nodes, edges)`

Hook for mode management and filtering.

**Parameters:**
- `nodes: Node[]` - All nodes to filter
- `edges: Edge[]` - All edges to filter

**Returns:**
```typescript
{
  currentMode: ViewMode;
  previousMode: ViewMode | null;
  setMode: (mode: ViewMode, preserveState?: boolean) => void;
  goBack: () => void;
  filteredNodes: Node[];
  filteredEdges: Edge[];
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

### `ModeSelector` Component

**Props:**
```typescript
{
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  showDescriptions?: boolean;  // default: true
  showShortcuts?: boolean;     // default: true
  className?: string;
  style?: React.CSSProperties;
}
```

### Filter Functions

```typescript
import { applyModeFilters } from '@/lib/modes/filters';

const result = applyModeFilters(nodes, edges, 'composition');
// Returns: { nodes, edges, stats }
```

### Mode Metadata

```typescript
import {
  MODE_METADATA,
  getModeMetadata,
  getModeName,
  getModeIcon
} from '@/lib/modes/metadata';

const meta = getModeMetadata('composition');
// { id, name, description, icon, shortcut, ... }
```

## Filtering Logic

### Node Filtering

Each mode defines which node types are visible:

```typescript
// Explorer: All node types
['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved']

// Composition: Structure-focused
['template', 'fragment', 'bundle', 'resolved']

// Dependency: High-level only
['template', 'bundle', 'fragment']

// Execution: All with emphasis on variables
['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved']

// Validation: All (filtered by validation state)
['template', 'fragment', 'variable', 'toolConfig', 'bundle', 'resolved']
```

### Edge Filtering

Each mode defines which edge types are visible:

```typescript
// Explorer: All edge types
['extends', 'mixin', 'variable', 'toolRef', 'composition']

// Composition: Structure relationships
['extends', 'mixin', 'composition']

// Dependency: Inheritance only
['extends', 'mixin']

// Execution: All edge types
['extends', 'mixin', 'variable', 'toolRef', 'composition']

// Validation: All edge types
['extends', 'mixin', 'variable', 'toolRef', 'composition']
```

## State Management

### Backend Store (Zustand)

The mode system uses a Zustand store defined in `src/lib/modes/mode-store.ts`:

```typescript
import { useModeStore } from '@backend/lib/modes/mode-store';

// Access mode state directly
const currentMode = useModeStore((state) => state.currentMode);
const setMode = useModeStore((state) => state.setMode);

// Mode-specific actions
const setSearchQuery = useModeStore((state) => state.setSearchQuery);
const setDependencyDepth = useModeStore((state) => state.setDependencyDepth);
```

### Mode-Specific State

Each mode has its own state structure:

**Explorer:**
- Search query
- Selected category
- Filter tags
- Sort preferences

**Composition:**
- Component filter
- Active composition
- Selected library items
- Panel open state

**Dependency:**
- Root node
- Depth level
- Visibility toggles
- Highlight mode

**Execution:**
- Executing template
- Variable values
- Variable errors
- Preview state

**Validation:**
- Selected result
- Severity filter
- Show failed only
- Applied fixes

## Performance Considerations

### Memoization

The `useModes` hook uses `useMemo` to prevent unnecessary recalculations:

```typescript
const filterResult = useMemo(() => {
  return applyModeFilters(nodes, edges, currentMode);
}, [nodes, edges, currentMode]);
```

### Filter Complexity

- **Explorer:** O(1) - no filtering
- **Composition:** O(n) - type-based filtering
- **Dependency:** O(n) - type-based filtering
- **Execution:** O(n) - type-based with enhancement
- **Validation:** O(n) - validation state checking

## Testing

### Manual Testing Checklist

- [ ] All 5 modes switch correctly
- [ ] Keyboard shortcuts (1-5) work
- [ ] Filter stats update correctly
- [ ] Mode persists across page reloads
- [ ] Nodes/edges filtered appropriately in each mode
- [ ] Mode switching animations smooth
- [ ] Mode descriptions show on hover
- [ ] No console errors

### Test with Demo Templates

The system has been tested with 3 demo templates:
1. `code-reviewer` - Code review agent
2. `doc-generator` - Documentation generator
3. `test-writer` - Test writing agent

## Future Enhancements

### Potential Improvements

1. **Mode-Specific Layouts:** Different layout algorithms per mode
2. **Mode Transitions:** Animated transitions between modes
3. **Mode Bookmarks:** Save specific mode configurations
4. **Mode Sharing:** Share mode configurations via URL
5. **Custom Modes:** User-defined custom view modes
6. **Mode Analytics:** Track mode usage patterns
7. **Mode Presets:** Quick-switch mode presets for common workflows

### Extension Points

The mode system is designed for extensibility:

```typescript
// Add new mode types
export type ViewMode =
  | 'explorer'
  | 'composition'
  | 'dependency'
  | 'execution'
  | 'validation'
  | 'custom';  // New mode type

// Add new metadata
export const MODE_METADATA: Record<ViewMode, ModeMetadata> = {
  // ... existing modes
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Custom view mode',
    icon: '⚙️',
    shortcut: '6',
    supportsEditing: true,
    showsCanvas: true,
    hasSidebar: true,
  },
};

// Add new filter logic
function filterCustomMode(nodes, edges) {
  // Custom filtering logic
  return { nodes, edges };
}
```

## Troubleshooting

### Common Issues

**Issue:** Mode doesn't switch
- **Solution:** Check if keyboard focus is in an input field

**Issue:** Nodes not filtering correctly
- **Solution:** Verify node.type property is set correctly

**Issue:** Mode state not persisting
- **Solution:** Check localStorage is enabled in browser

**Issue:** TypeScript errors
- **Solution:** Ensure all imports use correct paths (@backend/lib/modes/*)

### Debug Mode

Enable debug logging:

```typescript
// In useModes.ts
console.log('Current mode:', currentMode);
console.log('Filter result:', filterResult);
console.log('Visible nodes:', filteredNodes.length);
```

## Contributing

When modifying the mode system:

1. Update type definitions in `src/lib/modes/types.ts`
2. Add filter logic in `ui/src/lib/modes/filters.ts`
3. Update metadata in `ui/src/lib/modes/metadata.ts`
4. Test all 5 modes with demo templates
5. Update this documentation

## Related Documentation

- [Agent Template System](/docs/TEMPLATES.md)
- [ReactFlow Integration](/ui/docs/REACTFLOW.md)
- [State Management](/ui/docs/STATE.md)
- [Layout System](/ui/docs/LAYOUTS.md)

## Version History

- **v1.0.0** (2025-11-10): Initial implementation
  - 5 view modes
  - Tab interface with keyboard shortcuts
  - Mode-specific filtering
  - localStorage persistence
  - Integration with App.tsx

---

**Implemented by:** Agent 1 (View Mode Engineer) - Wave 2
**Date:** November 10, 2025
**Status:** Complete ✅
