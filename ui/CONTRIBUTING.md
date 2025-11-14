# Contributing to ReactFlow Template UI

Thank you for your interest in contributing! This guide will help you get started.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Code Style](#code-style)
3. [Project Structure](#project-structure)
4. [Adding Features](#adding-features)
5. [Testing](#testing)
6. [Pull Requests](#pull-requests)
7. [Documentation](#documentation)

---

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/TuckerTucker/tkr-llm-client.git
cd tkr-llm-client/ui

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Project Scripts

```bash
npm run dev         # Start dev server with hot reload
npm run build       # Build for production
npm run preview     # Preview production build
npm run type-check  # TypeScript type checking
npm run test        # Run tests (future)
npm run lint        # Lint code (future)
```

---

## Code Style

### TypeScript

We use **TypeScript strict mode** throughout the project.

**Guidelines:**

1. **Type Everything:**
```typescript
// ✅ Good
function processNode(node: Node<NodeData>): ProcessedNode {
  return { ...node, processed: true };
}

// ❌ Bad
function processNode(node: any) {
  return { ...node, processed: true };
}
```

2. **No `any` Type:**
```typescript
// ✅ Good
const data: unknown = parseJSON(str);
if (isNodeData(data)) {
  processNode(data);
}

// ❌ Bad
const data: any = parseJSON(str);
processNode(data);
```

3. **Use Interfaces for Props:**
```typescript
// ✅ Good
interface MyComponentProps {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}

function MyComponent({ title, onClose, children }: MyComponentProps) {
  // ...
}
```

4. **Export Types:**
```typescript
// ✅ Good
export interface NodeData {
  id: string;
  label: string;
}

export type NodeType = 'template' | 'fragment' | 'variable';
```

---

### React

**Guidelines:**

1. **Functional Components:**
```typescript
// ✅ Good
function MyComponent({ value }: { value: string }) {
  return <div>{value}</div>;
}

// ❌ Bad (don't use class components)
class MyComponent extends React.Component {
  render() {
    return <div>{this.props.value}</div>;
  }
}
```

2. **Hooks:**
```typescript
// ✅ Good - Custom hook
function useCustomLogic(input: string) {
  const [state, setState] = useState(input);

  const update = useCallback(() => {
    setState(prev => prev + '!');
  }, []);

  return { state, update };
}
```

3. **Memoization:**
```typescript
// ✅ Good - Memoize expensive computations
const sortedNodes = useMemo(
  () => nodes.sort((a, b) => a.position.y - b.position.y),
  [nodes]
);

// ✅ Good - Memoize callbacks
const handleClick = useCallback(
  (id: string) => {
    selectNode(id);
  },
  [selectNode]
);
```

4. **Component Naming:**
```typescript
// ✅ Good - PascalCase for components
export function TemplateNode() { }
export function VariablePanel() { }

// ✅ Good - camelCase for hooks
export function useCanvas() { }
export function useModes() { }
```

---

### File Organization

```typescript
// 1. Imports (sorted)
import React, { useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import { useCanvas } from '@/hooks/useCanvas';
import type { NodeData } from '@/lib/types';

// 2. Type definitions
interface MyComponentProps {
  // ...
}

// 3. Component
export function MyComponent({ }: MyComponentProps) {
  // ...
}

// 4. Helper functions (if needed)
function helperFunction() {
  // ...
}
```

---

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TemplateNode`, `VariablePanel` |
| Hooks | camelCase with `use` prefix | `useCanvas`, `useModes` |
| Functions | camelCase | `convertTemplate`, `applyLayout` |
| Constants | UPPER_SNAKE_CASE | `MAX_HISTORY`, `DEFAULT_ZOOM` |
| Types/Interfaces | PascalCase | `NodeData`, `EdgeType` |
| Files (components) | PascalCase | `TemplateNode.tsx` |
| Files (utils) | camelCase | `nodePositioning.ts` |

---

### Comments

**Use JSDoc for public APIs:**

```typescript
/**
 * Converts an agent template to ReactFlow nodes and edges.
 *
 * @param template - The agent template to convert
 * @param options - Optional conversion settings
 * @returns Conversion result with nodes, edges, and metadata
 *
 * @example
 * ```typescript
 * const result = convertTemplateToReactFlow(template);
 * console.log(result.nodes.length); // 5 nodes
 * ```
 */
export function convertTemplateToReactFlow(
  template: AgentTemplate,
  options?: ConversionOptions
): TemplateConversionResult {
  // ...
}
```

**Inline comments for complex logic:**

```typescript
// Calculate grid columns using square root for optimal layout
const columns = Math.ceil(Math.sqrt(nodes.length));

// HACK: Workaround for ReactFlow bug #1234
// TODO: Remove when fixed upstream
const adjustedPosition = { x: position.x + 1, y: position.y };
```

---

## Project Structure

### Adding New Files

**Components:**
```
ui/src/components/
├── [category]/
│   ├── MyComponent.tsx       # Component implementation
│   ├── MyComponent.test.tsx  # Unit tests (future)
│   └── index.ts              # Exports
```

**Hooks:**
```
ui/src/hooks/
├── useMyHook.ts              # Hook implementation
├── useMyHook.test.ts         # Unit tests
└── index.ts                  # Exports (update this)
```

**Types:**
```
ui/src/lib/types/
├── my-types.ts               # Type definitions
└── index.ts                  # Exports (update this)
```

---

## Adding Features

### Adding a New View Mode

**1. Update types:**
```typescript
// src/lib/modes/types.ts
export type ViewMode =
  | 'explorer'
  | 'composition'
  | 'dependency'
  | 'execution'
  | 'validation'
  | 'myNewMode';  // ← Add here
```

**2. Add metadata:**
```typescript
// src/lib/modes/metadata.ts
export const MODE_METADATA: Record<ViewMode, ModeMetadata> = {
  // ...existing modes
  myNewMode: {
    id: 'myNewMode',
    name: 'My New Mode',
    description: 'Description of what this mode does',
    icon: '🎯',
    shortcut: '6',
    supportsEditing: true,
    showsCanvas: true,
    hasSidebar: false,
  },
};
```

**3. Add filter logic:**
```typescript
// src/lib/modes/filters.ts
function filterMyNewMode(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  // Filter logic
  const filteredNodes = nodes.filter(node => {
    // Your filter condition
    return true;
  });

  const filteredEdges = edges.filter(edge => {
    // Your filter condition
    return true;
  });

  return { nodes: filteredNodes, edges: filteredEdges };
}

// Add to applyModeFilters function
export function applyModeFilters(/* ... */) {
  // ...
  case 'myNewMode':
    return filterMyNewMode(nodes, edges);
  // ...
}
```

**4. Update documentation:**
- Add section to `USER_GUIDE.md`
- Update mode list in `API.md`
- Document in `docs/MODE_SYSTEM.md`

---

### Adding a New Layout Algorithm

**1. Implement algorithm:**
```typescript
// src/lib/layout/algorithms/myLayout.ts
export function myLayout(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig
): { nodes: Node[]; edges: Edge[] } {
  // Layout calculation logic
  const positioned Nodes = nodes.map(node => ({
    ...node,
    position: calculatePosition(node)
  }));

  return { nodes: positionedNodes, edges };
}
```

**2. Register algorithm:**
```typescript
// src/lib/layout/algorithms.ts (or equivalent)
export const LAYOUT_ALGORITHMS = {
  dagre: dagreLayout,
  force: forceLayout,
  elk: elkLayout,
  grid: gridLayout,
  circular: circularLayout,
  tree: treeLayout,
  manual: manualLayout,
  myLayout: myLayout,  // ← Add here
};
```

**3. Add metadata:**
```typescript
// src/hooks/useLayoutSelector.ts
export const LAYOUT_OPTIONS: LayoutMetadata[] = [
  // ...existing layouts
  {
    id: 'myLayout',
    name: 'My Layout',
    icon: '⚡',
    description: 'Description of algorithm',
    performance: '~50ms for 50 nodes',
    bestFor: 'Specific use case',
  },
];
```

**4. Update types:**
```typescript
// src/hooks/useAutoLayout.ts
export type LayoutAlgorithmType =
  | 'dagre'
  | 'force'
  | 'elk'
  | 'grid'
  | 'circular'
  | 'tree'
  | 'manual'
  | 'myLayout';  // ← Add here
```

**5. Document:**
- Add section to `USER_GUIDE.md`
- Update `LAYOUT_SYSTEM.md`
- Add usage example

---

### Adding a New Node Type

**1. Create node data type:**
```typescript
// src/lib/types/ui-types.ts
export interface MyNodeData extends NodeData {
  type: 'myNode';
  specificProperty: string;
  // ...other properties
}
```

**2. Create node component:**
```typescript
// src/components/nodes/MyNode.tsx
import { BaseNode } from './BaseNode';
import type { MyNodeData } from '@/lib/types';

interface MyNodeProps {
  id: string;
  data: MyNodeData;
  selected?: boolean;
  dragging?: boolean;
  zoomLevel?: number;
}

export function MyNode(props: MyNodeProps) {
  return (
    <BaseNode
      {...props}
      icon={<MyIcon />}
      headerActions={<MyActions />}
    >
      <div className="my-node-content">
        <span>{props.data.specificProperty}</span>
      </div>
    </BaseNode>
  );
}
```

**3. Register node type:**
```typescript
// src/components/nodes/index.ts
export const nodeTypes = {
  template: TemplateNode,
  fragment: FragmentNode,
  variable: VariableNode,
  toolConfig: ToolConfigNode,
  bundle: BundleNode,
  resolved: ResolvedNode,
  myNode: MyNode,  // ← Add here
};
```

**4. Add to converter (if applicable):**
```typescript
// src/lib/converters/templateToReactFlow.ts
// Add logic to create MyNode instances from templates
```

**5. Document:**
- Add to README
- Update USER_GUIDE.md
- Add Storybook story (future)

---

### Adding a New Variable Type

**1. Add to enum:**
```typescript
// Variable types
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  // ...
  MY_TYPE = 'my_type',  // ← Add here
}
```

**2. Create input component:**
```typescript
// src/components/variables/inputs/MyTypeInput.tsx
interface MyTypeInputProps {
  value: any;
  onChange: (value: any) => void;
  error?: string;
  placeholder?: string;
}

export function MyTypeInput({
  value,
  onChange,
  error,
  placeholder
}: MyTypeInputProps) {
  return (
    <div>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

**3. Register input:**
```typescript
// src/components/variables/VariableInput.tsx
const INPUT_COMPONENTS = {
  string: StringInput,
  number: NumberInput,
  boolean: BooleanInput,
  my_type: MyTypeInput,  // ← Add here
};
```

**4. Add validation:**
```typescript
// src/lib/variables/validation.ts
function validateMyType(value: any): boolean {
  // Validation logic
  return true;
}

export function validateVariable(/* ... */) {
  switch (definition.type) {
    // ...
    case VariableType.MY_TYPE:
      return validateMyType(value);
  }
}
```

**5. Document:**
- Update USER_GUIDE.md variable types section
- Add examples

---

## Testing

### Unit Tests

**Location:** `src/[category]/__tests__/`

**Framework:** Vitest (future)

**Example:**
```typescript
// src/hooks/__tests__/useCanvas.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useCanvas } from '../useCanvas';

describe('useCanvas', () => {
  it('should add node', () => {
    const { result } = renderHook(() => useCanvas());

    act(() => {
      result.current.addNode({
        id: 'test',
        type: 'template',
        position: { x: 0, y: 0 },
        data: { /* ... */ }
      });
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].id).toBe('test');
  });
});
```

---

### Integration Tests

**Location:** `src/__tests__/integration/`

**Example:**
```typescript
// src/__tests__/integration/template-workflow.test.ts
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '@/App';

describe('Template Workflow', () => {
  it('should load and display template', async () => {
    render(<App />);

    // Select template
    const template = screen.getByText('code-reviewer');
    fireEvent.click(template);

    // Verify nodes appear
    await screen.findByTestId('canvas');
    expect(screen.getAllByTestId('node')).toHaveLength(3);
  });
});
```

---

### Test Coverage

**Targets:**
- Unit tests: > 80% coverage
- Integration tests: Critical workflows
- E2E tests: User journeys (future)

**Run tests:**
```bash
npm run test           # Run all tests
npm run test:unit      # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage  # Coverage report
```

---

## Pull Requests

### Before Submitting

1. **Test your changes:**
```bash
npm run type-check     # TypeScript check
npm run build          # Build succeeds
npm run test           # Tests pass
```

2. **Update documentation:**
- Update USER_GUIDE.md if user-facing
- Update API.md if API changes
- Update CHANGELOG.md

3. **Follow commit conventions:**
```
feat: add new layout algorithm
fix: correct node positioning bug
docs: update API documentation
refactor: simplify mode filtering logic
test: add tests for useCanvas hook
chore: update dependencies
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] TypeScript compiles without errors
- [ ] Tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. Submit PR
2. Automated checks run (CI/CD future)
3. Code review by maintainer
4. Address feedback
5. Merge when approved

---

## Documentation

### When to Update Docs

**USER_GUIDE.md:** User-facing features
**API.md:** Public API changes
**ARCHITECTURE.md:** System design changes
**CONTRIBUTING.md:** Process changes (this file)
**CHANGELOG.md:** All changes

### Documentation Style

- Clear, concise language
- Code examples for complex concepts
- Screenshots for UI features (future)
- Keep up-to-date with code

---

## Questions?

- Check existing documentation
- Review related code
- Ask in GitHub issues
- Contact maintainers

---

## Code of Conduct

Be respectful, inclusive, and collaborative. We welcome contributions from developers of all experience levels.

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

**Thank you for contributing!**

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
