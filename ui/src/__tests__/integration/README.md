# Integration Tests

Integration tests verify that multiple components work together correctly as a system.

## Test Structure

```
integration/
├── README.md (this file)
├── e2e-workflow.test.ts       # Complete user workflows
├── view-modes.test.ts         # View mode switching (future)
├── interactions.test.ts       # User interactions (future)
├── export.test.ts             # Export functionality (future)
└── error-handling.test.ts     # Error scenarios (future)
```

## Running Tests

```bash
npm run test                    # Run all tests
npm run test:integration        # Integration tests only
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

## Test Categories

### E2E Workflow Tests (`e2e-workflow.test.ts`)

**Coverage:**
- Template selection → conversion → layout → render
- Mode switching workflow
- Layout switching workflow
- Undo/redo through complete workflow
- Error handling in conversion and layout
- Performance benchmarks
- State persistence through pipeline

**Key Tests:**
1. `should complete full workflow: select → convert → layout → render`
2. `should handle mode switching in workflow`
3. `should handle layout switching in workflow`
4. `should support undo/redo in complete workflow`
5. `should handle conversion errors gracefully`
6. `should convert template within performance budget`
7. `should maintain state through workflow steps`

### View Mode Tests (`view-modes.test.ts`) - Future

**Coverage:**
- All 5 view modes (explorer, composition, dependency, execution, validation)
- Mode-specific filtering logic
- Node visibility per mode
- Edge visibility per mode
- Filter statistics accuracy
- Mode persistence
- Mode history

### Interaction Tests (`interactions.test.ts`) - Future

**Coverage:**
- Node selection (single, multi)
- Node dragging
- Context menus (node, edge, canvas)
- Keyboard shortcuts
- Drag and drop from catalog
- Node details panel
- Variable panel

### Export Tests (`export.test.ts`) - Future

**Coverage:**
- Export to YAML
- Export to JSON
- Export to Markdown
- Canvas state export
- Export validation
- Large template export

### Error Handling Tests (`error-handling.test.ts`) - Future

**Coverage:**
- Invalid template data
- Network errors
- Missing dependencies
- Circular dependencies
- Validation errors
- Recovery mechanisms

## Test Patterns

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useCustomHook());

act(() => {
  result.current.doSomething();
});

expect(result.current.state).toBe(expectedValue);
```

### Async Testing

```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

### Store Testing

```typescript
const store = useCanvasStore.getState();

store.addNode(node);
store.pushHistory();

expect(store.canUndo()).toBe(true);
```

## Writing New Tests

1. **Create test file** in `integration/` directory
2. **Import dependencies:**
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   import { renderHook, act, waitFor } from '@testing-library/react';
   ```
3. **Use descriptive test names:**
   ```typescript
   describe('Feature Name', () => {
     it('should do something specific when condition', () => {
       // Test implementation
     });
   });
   ```
4. **Clean up between tests:**
   ```typescript
   beforeEach(() => {
     // Reset stores
     useCanvasStore.getState().reset();
   });
   ```
5. **Assert expected behavior:**
   ```typescript
   expect(result).toBe(expected);
   expect(array).toHaveLength(3);
   expect(object).toHaveProperty('key');
   ```

## Performance Targets

Tests verify these performance targets:

- **Template conversion:** < 100ms
- **Layout calculation:** < 50ms for 50 nodes
- **Mode switching:** < 100ms
- **Render time:** < 16ms per frame (60fps)
- **Memory:** No leaks, proper cleanup

## Coverage Goals

- **Unit tests:** > 80% coverage
- **Integration tests:** All critical workflows
- **E2E tests:** Key user journeys (future)

Current coverage: See `npm run test:coverage`

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-publish checks

## Debugging Tests

```bash
# Run specific test file
npm run test e2e-workflow

# Run tests matching pattern
npm run test --grep "workflow"

# Debug mode
npm run test:debug

# Verbose output
npm run test --reporter=verbose
```

## Mocking

We use Vitest's built-in mocking:

```typescript
import { vi } from 'vitest';

// Mock function
const mockFn = vi.fn();

// Mock module
vi.mock('@/lib/utils', () => ({
  utilFunction: vi.fn(() => 'mocked'),
}));
```

## Test Data

Mock templates and data in `__tests__/fixtures/` (future).

## Best Practices

1. **Isolate tests:** Each test should be independent
2. **Clean state:** Reset stores between tests
3. **Descriptive names:** Test names should describe behavior
4. **Arrange-Act-Assert:** Clear test structure
5. **No flaky tests:** Tests should be deterministic
6. **Fast tests:** Keep integration tests under 1s each
7. **Meaningful assertions:** Assert meaningful behavior, not implementation

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Contributing guidelines
- [API.md](../../API.md) - API reference
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System architecture

---

**Last Updated:** November 10, 2025
**Version:** 1.0.0
