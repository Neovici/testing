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

### Host Element Access

The `renderHook` function returns a `host` element that can be used to test hooks that depend on `useHost()` from `@neovici/cosmoz-utils`:

```typescript
import { renderHook } from '@neovici/testing';
import { hook } from '@pionjs/pion';

// Hook that uses useHost()
const useHostElement = hook(
  class extends Hook {
    update() {
      return this.state.host as HTMLElement;
    }
  }
) as () => HTMLElement;

// Test hooks that depend on host element
describe('hooks with useHost', () => {
  it('should expose host element', async () => {
    const { host, result } = await renderHook(() => useHostElement());
    expect(host).to.be.instanceOf(HTMLElement);
    expect(result.current).to.equal(host);
  });
});
```

This is particularly useful for testing hooks like `use-close` that need access to the host element's shadow root and event capabilities.

### Return Value

The `renderHook` function returns an object with the following properties:

- `result`: The current result of the hook execution
- `rerender(newProps?)`: Re-render the hook with new props
- `unmount()`: Unmount the hook and cleanup
- `nextUpdate(message?, options?)`: Wait for the next update
- `host`: The host element (HTMLElement) for hooks that use `useHost()`

### Options

- `initialProps`: Initial props to pass to the hook
- `wrapper`: A wrapper function to wrap the hook rendering
