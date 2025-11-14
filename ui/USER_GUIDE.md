# ReactFlow Template UI - User Guide

**Version:** 1.0.0
**Last Updated:** November 10, 2025
**Status:** Production Ready

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Template Catalog](#template-catalog)
3. [Canvas Operations](#canvas-operations)
4. [View Modes](#view-modes)
5. [Layout Algorithms](#layout-algorithms)
6. [Node Interactions](#node-interactions)
7. [Variable Management](#variable-management)
8. [Undo/Redo](#undoredo)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Troubleshooting](#troubleshooting)
11. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Running the UI

```bash
cd ui
npm install
npm run dev
# Open http://localhost:5173 in your browser
```

### First Steps

1. **Select a template** from the catalog on the left sidebar
2. **Watch nodes appear** on the canvas with automatic layout
3. **Explore different view modes** using the mode selector (1-5 keys)
4. **Try different layout algorithms** by pressing 'L'
5. **Edit variables** by pressing 'V'

### Interface Overview

The UI consists of four main areas:

```
┌─────────────┬───────────────────────────────────┐
│             │         Header (Title + Modes)    │
│  Template   ├───────────────────────────────────┤
│  Catalog    │                                   │
│  (Left)     │         Canvas Area               │
│             │                                   │
│             │                                   │
└─────────────┴───────────────────────────────────┘
                              │ Variable Panel (Right)
```

---

## Template Catalog

The Template Catalog displays all available agent templates with rich metadata.

### Selecting Templates

- **Click any template** to load it on the canvas
- **Selected template** is highlighted with a blue border
- **Template info** shows: name, description, version, tags, tools

### Available Demo Templates

#### 1. Code Reviewer
- **Description:** Reviews code for quality, bugs, and best practices
- **Tools:** Read, Grep
- **Variables:** codePath, maxFileSize, includeTests, excludePatterns
- **Best for:** Code quality analysis

#### 2. Doc Generator
- **Description:** Generates documentation from code
- **Tools:** Read, Write
- **Variables:** targetPath, outputFormat, includePrivate
- **Best for:** API documentation

#### 3. Test Writer
- **Description:** Writes unit tests for code
- **Tools:** Read, Write
- **Variables:** sourceFile, testFramework, coverageThreshold
- **Best for:** Test generation

### Catalog Controls

- **Show/Hide Catalog:** Click the "Hide Catalog" button in the header
- **Search:** (Future feature) Filter templates by name or tag

---

## Canvas Operations

The canvas is the main workspace for visualizing and interacting with templates.

### Navigation

| Action | Method |
|--------|--------|
| **Pan** | Click and drag on the background |
| **Zoom In** | Mouse wheel up or **+** key |
| **Zoom Out** | Mouse wheel down or **-** key |
| **Fit View** | Double-click background or **F** key |
| **Reset View** | Press **R** key |

### Node Types

The canvas displays different types of nodes:

#### Template Node (Blue)
- **Size:** 200x150px
- **Shape:** Rectangle
- **Shows:** Name, description, tools, version
- **Represents:** Main agent template

#### Tool Config Node (Teal)
- **Size:** 150x120px
- **Shape:** Hexagon
- **Shows:** Tool name, permissions
- **Represents:** Tool configuration

#### Variable Node (Yellow)
- **Size:** 100x80px
- **Shape:** Diamond
- **Shows:** Variable name, type, required status
- **Represents:** Template variable

#### Fragment Node (Green)
- **Size:** 150x100px
- **Shape:** Rounded rectangle
- **Shows:** Fragment name, type
- **Represents:** Prompt fragment

#### Bundle Node (Purple)
- **Size:** Variable
- **Shape:** Container
- **Shows:** Bundle name, contained tools
- **Represents:** Tool bundle

#### Resolved Node (Gray)
- **Size:** 200x150px
- **Shape:** Rectangle
- **Shows:** Final resolved configuration
- **Represents:** Output configuration

### Edge Types

Edges connect nodes and represent relationships:

| Type | Color | Style | Meaning |
|------|-------|-------|---------|
| **Extends** | Purple | Thick solid (3px) | Inheritance |
| **Mixin** | Green | Dashed (2px) | Fragment mixing |
| **Variable** | Yellow | Dotted (1px) | Variable binding |
| **Tool Ref** | Blue | Thin solid (1px) | Tool reference |
| **Bundle** | Purple | Solid (2px) | Tool bundle |
| **Composition** | Blue | Solid (2px) | Composition |

---

## View Modes

View modes filter the canvas to show only relevant nodes and edges for specific tasks.

### Mode Selector

The mode selector appears below the header. Click any mode or press its number key.

### 1. Explorer Mode (Default)

**Shortcut:** `1`
**Icon:** 🔍
**Purpose:** General exploration and browsing

**Shows:**
- All nodes
- All edges
- Full graph structure

**Best for:**
- Understanding complete template structure
- General browsing
- Finding specific elements

**Layout:** Dagre (top-to-bottom hierarchical)

---

### 2. Composition Mode

**Shortcut:** `2`
**Icon:** 🧩
**Purpose:** Understanding template structure and composition

**Shows:**
- Template nodes
- Fragment nodes
- Bundle nodes
- Resolved nodes
- Extends, Mixin, Composition edges only

**Hides:**
- Variable nodes
- Tool config nodes
- Variable edges

**Best for:**
- Understanding how templates are composed
- Visualizing inheritance hierarchies
- Analyzing fragment usage

**Layout:** Tree (strict hierarchy)

---

### 3. Dependency Mode

**Shortcut:** `3`
**Icon:** 🔗
**Purpose:** Visualizing template dependencies

**Shows:**
- Template nodes
- Bundle nodes
- Fragment nodes
- Extends and Mixin edges only

**Hides:**
- Variables
- Tool configs
- Resolved nodes

**Best for:**
- Dependency analysis
- Understanding template relationships
- Identifying circular dependencies

**Layout:** Force-directed (network visualization)

---

### 4. Execution Mode

**Shortcut:** `4`
**Icon:** ▶️
**Purpose:** Understanding runtime flow and variable usage

**Shows:**
- All nodes with emphasis on variables
- All edges
- Variable flow highlighted

**Best for:**
- Runtime analysis
- Variable flow visualization
- Execution path understanding

**Layout:** Dagre (left-to-right flow)

---

### 5. Validation Mode

**Shortcut:** `5`
**Icon:** ✓
**Purpose:** Reviewing validation results and errors

**Shows:**
- Nodes with validation issues (or all if no issues)
- Error states highlighted
- All edges

**Best for:**
- Finding errors
- Validation review
- Quality assurance

**Layout:** Grid (clean organization)

---

### Mode Statistics

The header shows filter statistics for each mode:

```
5 / 5 nodes    2 / 2 edges    Explorer Mode
```

This tells you:
- **5 visible nodes** out of **5 total nodes**
- **2 visible edges** out of **2 total edges**
- **Currently in Explorer Mode**

---

## Layout Algorithms

Layout algorithms automatically position nodes for optimal visualization.

### Opening Layout Selector

Press **L** to open the layout selector modal.

### Available Layouts

#### 1. Dagre (Hierarchical) - **RECOMMENDED**

**Shortcut:** Press `1` when layout selector is open
**Icon:** ⬇
**Best for:** Directed graphs, template hierarchies
**Performance:** ~35ms for 50 nodes

**Features:**
- Top-to-bottom or left-to-right
- Minimizes edge crossings
- Clear hierarchy visualization

**Use when:**
- Visualizing template inheritance
- Showing clear data flow
- Need hierarchical structure

---

#### 2. Force-Directed (Network)

**Shortcut:** Press `2` when layout selector is open
**Icon:** 🌐
**Best for:** Network visualization, exploring relationships
**Performance:** ~150ms for 50 nodes

**Features:**
- Physics-based simulation
- Natural clustering
- Organic appearance

**Use when:**
- Exploring relationships
- Visualizing networks
- Need natural grouping

---

#### 3. ELK (Advanced Hierarchical)

**Shortcut:** Press `3` when layout selector is open
**Icon:** ⚡
**Best for:** Complex hierarchies, large graphs
**Performance:** ~75ms for 50 nodes

**Features:**
- Advanced crossing reduction
- Port constraints
- Layer assignment

**Use when:**
- Complex hierarchies
- Large graphs (> 50 nodes)
- Need precise control

---

#### 4. Grid (Uniform Spacing)

**Shortcut:** Press `4` when layout selector is open
**Icon:** 📐
**Best for:** Equal spacing, clean organization
**Performance:** ~5ms for any size

**Features:**
- Uniform grid spacing
- Auto-calculated columns
- Predictable layout

**Use when:**
- Need clean organization
- Comparing similar items
- Want consistency

---

#### 5. Circular (Cycle Emphasis)

**Shortcut:** Press `5` when layout selector is open
**Icon:** ⭕
**Best for:** Cyclical dependencies, equal importance
**Performance:** ~8ms for any size

**Features:**
- Evenly spaced around circle
- Emphasizes cycles
- Equal visual weight

**Use when:**
- Visualizing cycles
- All nodes equally important
- Compact visualization needed

---

#### 6. Tree (Strict Hierarchy)

**Shortcut:** Press `6` when layout selector is open
**Icon:** 🌳
**Best for:** Strict hierarchies, org charts
**Performance:** ~15ms for any size

**Features:**
- Classic tree structure
- Clear parent-child relationships
- Balanced layout

**Use when:**
- Clear hierarchies exist
- Need traditional tree view
- Org chart style preferred

---

#### 7. Manual (User Positioned)

**Shortcut:** Press `7` when layout selector is open
**Icon:** ✋
**Best for:** Preserving user-positioned nodes
**Performance:** ~0.1ms

**Features:**
- No automatic repositioning
- Preserves manual adjustments
- User control

**Use when:**
- Custom positioning needed
- Preserving layout
- After manual adjustments

---

### Layout Controls

| Action | Shortcut | Description |
|--------|----------|-------------|
| Open selector | **L** | Open layout picker |
| Quick select | **1-7** | Select layout (when open) |
| Reapply layout | **Cmd/Ctrl + L** | Reapply current layout |
| Close selector | **Esc** | Close picker |
| Navigate | **Arrow Up/Down** | Browse layouts |

### Layout Animations

Layouts animate smoothly by default:
- **Duration:** 300ms
- **Easing:** EaseInOutCubic
- **Auto-disabled:** For > 100 nodes (performance)

---

## Node Interactions

### Selection

**Single Select:**
- Click any node to select it
- Selected node has blue highlight
- Selection info appears in node details

**Multi-Select:**
- **Cmd/Ctrl + Click** to add to selection
- **Shift + Click** to select range (future feature)
- **Cmd/Ctrl + A** to select all

**Deselect:**
- Click on background
- Press **Escape**

### Node Details Panel

When a node is selected, a details panel appears showing:

- **Node properties** (type, id, label)
- **Metadata** (tags, version, etc.)
- **Connections** (incoming/outgoing edges)
- **Actions** (edit, duplicate, delete)

**Close panel:** Press **Escape** or click outside

### Context Menu

**Right-click on Node:**
- View Details
- Edit Properties (future)
- Duplicate (future)
- Delete (future)
- Select Connected Nodes (future)

**Right-click on Edge:**
- Edit Label (future)
- Change Type (future)
- Delete (future)

**Right-click on Canvas:**
- Select All
- Clear Selection
- Fit View
- Reset Zoom
- Undo
- Redo

---

## Variable Management

Variables are template parameters that can be configured at runtime.

### Opening Variable Panel

**Methods:**
- Press **V** key
- Click "Show Variables" button in header
- Auto-opens when template has required variables (future)

The variable panel slides in from the right side.

### Panel Layout

```
┌────────────────────────────┐
│ Variables: template-name   │
│ [Close]                    │
├────────────────────────────┤
│ Required Variables         │
│ ┌────────────────────────┐ │
│ │ codePath (FILE_PATH)   │ │
│ │ [input field]          │ │
│ │ [Browse]               │ │
│ └────────────────────────┘ │
│                            │
│ Optional Variables         │
│ ┌────────────────────────┐ │
│ │ includeTests (BOOLEAN) │ │
│ │ [checkbox]             │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│ [Save] [Reset]             │
└────────────────────────────┘
```

### Variable Types

The UI supports 11 variable types with specialized inputs:

#### 1. String
- **Input:** Text input
- **Validation:** Optional regex pattern
- **Example:** "output.txt"

#### 2. Number
- **Input:** Number input with spinners
- **Validation:** Min/max values
- **Example:** 42, 3.14

#### 3. Boolean
- **Input:** Checkbox
- **Values:** true / false
- **Example:** Include tests

#### 4. Array
- **Input:** Multi-line textarea
- **Format:** One item per line
- **Example:**
  ```
  node_modules/
  dist/
  .git/
  ```

#### 5. Object
- **Input:** JSON editor
- **Validation:** Valid JSON required
- **Example:** `{"key": "value"}`

#### 6. File Path
- **Input:** Text input with browse button
- **Validation:** Path format
- **Example:** `/path/to/file.txt`

#### 7. Directory Path
- **Input:** Text input with browse button
- **Validation:** Directory format
- **Example:** `/path/to/directory/`

#### 8. URL
- **Input:** URL input
- **Validation:** Valid URL format
- **Example:** `https://example.com`

#### 9. Email
- **Input:** Email input
- **Validation:** Valid email format
- **Example:** `user@example.com`

#### 10. Date
- **Input:** Date picker
- **Format:** ISO 8601
- **Example:** `2025-11-10`

#### 11. JSON
- **Input:** JSON editor with syntax highlighting
- **Validation:** Valid JSON structure
- **Example:** Complex configuration objects

### Variable Validation

Variables are validated in real-time:

- **Required fields:** Must be filled before saving
- **Type validation:** Must match declared type
- **Format validation:** URLs, emails, paths checked
- **Range validation:** Numbers checked against min/max
- **Pattern validation:** Strings checked against regex (if provided)

**Error display:**
- Red border on invalid input
- Error message below input
- Save button disabled until valid

### Editing Variables

1. **Open panel** (Press **V**)
2. **Edit values** in input fields
3. **See validation** (errors show immediately)
4. **Save changes** (Click "Save" button)
5. **Reset if needed** (Click "Reset" to restore)

**Keyboard shortcuts in panel:**
- **Tab** to navigate between fields
- **Enter** to save (when valid)
- **Escape** to close without saving

---

## Undo/Redo

The UI includes full undo/redo functionality with history management.

### Undo/Redo Controls

Location: Bottom-right corner of canvas

```
[ ↶ Undo ]  [ ↷ Redo ]
```

### Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| **Undo** | Cmd + Z | Ctrl + Z |
| **Redo** | Cmd + Shift + Z | Ctrl + Shift + Z |
| **Redo (alt)** | Cmd + Y | Ctrl + Y |

### What's Tracked

The system tracks:
- **Template loading**
- **Node dragging**
- **Node adding/removing**
- **Edge connecting**
- **Variable changes**
- **Layout changes**

### History Limits

- **Max history:** 50 states
- **Older states** automatically dropped
- **Memory efficient:** No large data duplication

### Visual Feedback

- **Disabled state:** Grayed out when no history
- **Hover tooltips:** Show keyboard shortcuts
- **Click feedback:** Visual ripple effect

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd/Ctrl + Z** | Undo |
| **Cmd/Ctrl + Shift + Z** | Redo |
| **Cmd/Ctrl + Y** | Redo (alternative) |
| **Cmd/Ctrl + A** | Select All |
| **Delete** / **Backspace** | Delete Selected (future) |
| **Escape** | Deselect / Close Panel |

### View Mode Shortcuts

| Shortcut | Mode |
|----------|------|
| **1** | Explorer Mode |
| **2** | Composition Mode |
| **3** | Dependency Mode |
| **4** | Execution Mode |
| **5** | Validation Mode |

### Layout Shortcuts

| Shortcut | Action |
|----------|--------|
| **L** | Open Layout Selector |
| **1-7** | Quick Layout Select (when open) |
| **Cmd/Ctrl + L** | Reapply Layout |

### Canvas Shortcuts

| Shortcut | Action |
|----------|--------|
| **F** | Fit View |
| **R** | Reset Viewport |
| **+** / **=** | Zoom In |
| **-** / **_** | Zoom Out |

### Panel Shortcuts

| Shortcut | Action |
|----------|--------|
| **V** | Toggle Variable Panel |

### Shortcut Behavior

- **Input fields:** Shortcuts disabled when typing
- **Modal dialogs:** Escape to close
- **Conflicts:** Input-specific shortcuts take precedence

---

## Troubleshooting

### Nodes Not Appearing

**Problem:** Template selected but no nodes show on canvas

**Solutions:**
1. Check console for errors (F12 → Console)
2. Verify template is valid (has name, tools, prompt)
3. Try different layout algorithm (press L)
4. Press F to fit view (nodes may be off-screen)
5. Click "Retry" if error message appears

---

### Performance Issues

**Problem:** UI feels slow or laggy

**Solutions:**
1. **Reduce nodes:** Use view modes to filter (press 1-5)
2. **Disable animations:** Switch to Grid or Manual layout
3. **Clear selection:** Press Escape to deselect all
4. **Close panels:** Close variable panel when not needed
5. **Smaller templates:** Load simpler templates

**Performance Tips:**
- Grid layout fastest (~5ms)
- Force layout slowest (~150ms)
- Animations auto-disable for > 100 nodes

---

### Layout Looks Wrong

**Problem:** Nodes positioned poorly or overlapping

**Solutions:**
1. **Try different layout:** Press L and select another
2. **Reapply layout:** Press Cmd/Ctrl + L
3. **Best layouts by graph type:**
   - Hierarchies → Dagre or Tree
   - Networks → Force-Directed
   - Simple → Grid
   - Cyclical → Circular

---

### Variables Not Saving

**Problem:** Variable changes don't persist

**Solutions:**
1. Check for validation errors (red borders)
2. Fix any invalid inputs
3. Click "Save" button explicitly
4. Check console for errors
5. Ensure all required fields filled

---

### Keyboard Shortcuts Not Working

**Problem:** Shortcuts don't trigger

**Solutions:**
1. **Check focus:** Click on canvas background first
2. **Not in input:** Shortcuts disabled when typing
3. **Correct OS:** Use Cmd on Mac, Ctrl on Windows/Linux
4. **Mode selector:** Number keys only work when selector open
5. **Browser conflicts:** Some browsers intercept certain shortcuts

---

### Canvas Empty After Error

**Problem:** Canvas blank after conversion error

**Solutions:**
1. Click "Retry" button in error overlay
2. Select different template
3. Check browser console for details
4. Refresh page (Cmd/Ctrl + R)
5. Clear browser cache

---

## Tips & Best Practices

### Workflow Recommendations

#### 1. Start with Explorer Mode
- Get complete picture of template
- Understand all components
- Identify key nodes

#### 2. Use Composition Mode for Structure
- Understand inheritance
- See fragment relationships
- Analyze composition patterns

#### 3. Switch to Dependency Mode
- Check for circular dependencies
- Understand template relationships
- Identify required fragments

#### 4. Use Execution Mode for Variables
- See variable flow
- Understand data dependencies
- Test runtime behavior

#### 5. Finish with Validation Mode
- Find and fix errors
- Verify all variables
- Check for warnings

---

### Performance Best Practices

1. **Use View Modes:** Filter unnecessary nodes
2. **Choose Right Layout:** Grid/Circular for speed
3. **Disable Animations:** For large graphs
4. **Close Unused Panels:** Reduce UI overhead
5. **Limit History:** Clear occasionally (refresh page)

---

### Organization Tips

1. **Consistent Naming:** Use clear template names
2. **Meaningful Tags:** Tag templates by category
3. **Document Variables:** Use clear descriptions
4. **Test Incrementally:** Test small changes frequently
5. **Save Often:** Export canvas state periodically (future)

---

### Keyboard Mastery

Learn these shortcuts for efficiency:

**Essential:**
- `V` - Variables
- `L` - Layouts
- `1-5` - View modes
- `Cmd/Ctrl + Z` - Undo

**Power User:**
- `Cmd/Ctrl + L` - Reapply layout
- `F` - Fit view
- `R` - Reset
- `Escape` - Close/deselect

---

### Visual Design Tips

1. **Choose appropriate view mode** for your task
2. **Use layout animations** for smooth transitions
3. **Leverage color coding** (node types have distinct colors)
4. **Pay attention to edge styles** (relationship types)
5. **Use zoom adaptively** (nodes show more detail when zoomed)

---

### Debugging Strategies

When something goes wrong:

1. **Open Console** (F12 → Console tab)
2. **Check for errors** (red text)
3. **Verify template structure** (metadata, agent, tools)
4. **Try simpler template** (test with code-reviewer)
5. **Check documentation** (this guide, API docs)
6. **Report issues** (with console output)

---

## Advanced Features

### Zoom-Aware Rendering

Nodes adapt detail level based on zoom:

| Zoom Level | Detail Level | Display |
|-----------|-------------|---------|
| < 0.5 | Minimal | Icon only |
| 0.5 - 1.0 | Compact | Icon + name |
| 1.0 - 1.5 | Standard | Key details |
| > 1.5 | Full | All details |

**Tip:** Zoom out for overview, zoom in for details

---

### Future Features

Coming soon:
- Export to YAML/JSON/Markdown
- Import templates from files
- Custom color themes
- Collaborative editing
- Template search/filter
- Node/edge creation
- Property editing
- Template validation
- Performance profiler

---

## Getting Help

### Resources

1. **This Guide** - Comprehensive user documentation
2. **[API.md](./API.md)** - Developer API reference
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design
4. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guide
5. **Browser Console** - Check for errors (F12)

### Support Channels

- GitHub Issues: Report bugs and feature requests
- Documentation: Check inline JSDoc comments
- Examples: See `/ui/src/examples/` directory

---

## Version History

**v1.0.0** (November 10, 2025)
- Initial release
- 5 view modes
- 7 layout algorithms
- Variable editing
- Undo/redo
- Template catalog
- Comprehensive documentation

---

**Generated:** November 10, 2025
**Version:** 1.0.0
**Status:** Production Ready
**Author:** Wave 3 Agent 4 - Documentation & Testing Engineer
