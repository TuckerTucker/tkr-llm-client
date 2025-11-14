# Storybook Stories for ReactFlow Nodes

This directory contains Storybook stories for all node components in the ReactFlow Template UI.

## Available Stories

### TemplateNode.stories.tsx
- Default template node
- Selected state
- With validation errors
- With warnings
- Loading state
- With extends (inheritance)
- With mixins (fragments)
- Semantic zoom levels (minimal, compact, standard, full)
- Complex template with all features

### VariableNode.stories.tsx
- String variable
- Number variable
- Boolean variable
- Enum variable
- Required empty (invalid state)
- Selected state
- Semantic zoom levels

### FragmentNode.stories.tsx (To be created)
- Default fragment
- With preview tooltip
- Usage count variations
- Zoom levels

### ToolConfigNode.stories.tsx (To be created)
- Default tool config
- With permissions
- With validation rules
- With error handling
- Expanded/collapsed states
- Zoom levels

### BundleNode.stories.tsx (To be created)
- Default bundle
- Expanded/collapsed
- Various tool counts
- Zoom levels

### ResolvedNode.stories.tsx (To be created)
- Default resolved config
- With copy action
- Full configuration display
- Zoom levels

### CustomEdge.stories.tsx (To be created)
- Extends edge (purple, solid)
- Mixin edge (green, dashed, animated)
- Variable edge (yellow, dotted)
- ToolRef edge (blue, solid)
- Bundle edge (purple, solid)
- Error edge (red, pulsing)

## Running Storybook

```bash
npm run storybook
```

## Testing Stories

All stories should be tested for:
- ✅ Visual appearance
- ✅ Interaction states (hover, select)
- ✅ Accessibility (keyboard nav, screen readers)
- ✅ Responsive zoom levels
- ✅ Validation states

## Visual Regression Testing

Stories are used for visual regression testing with Chromatic or Percy.

```bash
npm run test:visual
```

## Accessibility Testing

All node components must pass WCAG 2.1 AA compliance:
- Proper ARIA labels
- Keyboard navigation support
- Sufficient color contrast
- Focus indicators

## Performance Testing

Stories should render in <16ms for 60fps target.

## Notes

- All stories use ReactFlowProvider decorator
- Mock data follows the integration contract specifications
- Stories demonstrate semantic zoom behavior
- Each node type has comprehensive state coverage
