# testing
Testing library utilities

## renderHook

The `renderHook` function allows you to test hooks in isolation for web components using Pion.js.

### Basic Usage

```typescript
import { renderHook } from '@neovici/testing';
import { useState, useCallback } from '@pionjs/pion';

function useCounter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount(count + 1), [count]);
  return { count, increment };
}

describe('useCounter', () => {
  it('should return initial count', async () => {
    const { result } = await renderHook(() => useCounter());
    expect(result.current.count).to.equal(0);
  });
});
```

### Return Value

The `renderHook` function returns an object with the following properties:

- `result`: The current result of the hook execution
- `rerender(newProps?)`: Re-render the hook with new props
- `unmount()`: Unmount the hook and cleanup
- `nextUpdate(message?, options?)`: Wait for the next update
- `host`: The host element (HTMLElement) for hooks that need direct host access

### Options

- `initialProps`: Initial props to pass to the hook
- `wrapper`: A wrapper function to wrap the hook rendering
