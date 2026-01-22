import { renderHook } from '../src';
import { expect } from '@open-wc/testing';
import {
	useState,
	useCallback,
	useEffect,
	useRef,
	createContext,
	useContext,
	html,
	hook,
} from '@pionjs/pion';
import type { Hook } from '@pionjs/pion';

function useCounter() {
	const [count, setCount] = useState(0);
	const increment = useCallback(() => setCount((x) => (x ?? 0) + 1), []);
	return { count, increment };
}

function useValue(value: string) {
	const ref = useRef<string | undefined>(undefined);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref;
}

const TestContext = createContext<{ value?: string }>({});
customElements.define('test-ctx-provider', TestContext.Provider);

// Hook that uses useHost() for testing
const useHostElement = hook(
	class extends Hook {
		update() {
			return this.state.host as HTMLElement;
		}
	}
) as () => HTMLElement;

// Hook that uses useHost with specific type
const useHostWithType = hook(
	class extends Hook {
		update() {
			return this.state.host as HTMLButtonElement;
		}
	}
) as () => HTMLButtonElement;

describe('renderHook', () => {
	it('returns hook result', async () => {
		const { result, nextUpdate } = await renderHook(() => useCounter());
		expect(result.current.count).to.equal(0);
		expect(typeof result.current.increment).to.equal('function');
		setTimeout(() => result.current.increment());
		await nextUpdate();
		expect(result.current.count).to.equal(1);
		expect(result.all.length).to.equal(2);
	});
	it('renders initialProps', async () => {
		const { result } = await renderHook((value: string) => useValue(value), {
			initialProps: 'asd',
		});
		expect(result.current.current).to.equal('asd');
	});
	it('updates props', async () => {
		const { result, rerender } = await renderHook((value: string) =>
			useValue(value)
		);
		expect(result.current.current).to.be.undefined;
		await rerender('bda');
		expect(result.current.current).to.equal('bda');
	});

	it('unmounts', async () => {
		const { result, unmount } = await renderHook(() => {
			const ref = useRef<boolean>(false);
			useEffect(() => () => (ref.current = true), []);
			return ref;
		});
		expect(result.current.current).to.be.false;
		unmount();
		expect(result.current.current).to.be.true;
	});
	it('errors', async () => {
		const { result } = await renderHook(() => {
			throw new Error('asd');
		});
		expect(() => result.current).to.throw();
		expect(result.error).not.to.be.undefined;
	});
	it('wraps', async () => {
		const { result } = await renderHook(
			() => {
				return useContext(TestContext)?.value;
			},
			{
				initialProps: { value: 'tst' },
				wrapper: (el, props) =>
					html`<test-ctx-provider .value=${{ value: props?.value }}
						>${el}</test-ctx-provider
					>`,
			}
		);
		expect(result.current).to.equal('tst');
	});

	it('exposes host element', async () => {
		const { host, result } = await renderHook(() => useHostElement());
		expect(host).to.be.instanceOf(HTMLElement);
		expect(result.current).to.equal(host);
		expect(host.tagName.toLowerCase()).to.include('render-hook');
	});

	it('host element is accessible during hook execution', async () => {
		const capturedHost = [] as HTMLElement[];
		const captureHost = () => {
			const host = useHostElement();
			capturedHost.push(host);
			return host;
		};
		
		const { host } = await renderHook(() => captureHost());
		expect(capturedHost).to.have.lengthOf(1);
		expect(capturedHost[0]).to.equal(host);
	});

	it('host element has expected properties', async () => {
		const { host } = await renderHook(() => useHostElement());
		expect(host).to.have.property('tagName');
		expect(host).to.have.property('shadowRoot').that.is.null; // useShadowDOM: false
		expect(host).to.have.property('appendChild');
		expect(host).to.have.property('removeChild');
	});

	it('host element persists through rerender', async () => {
		const { host: initialHost, rerender, result } = await renderHook(
			(value: string) => {
				const host = useHostElement();
				return { host, value };
			},
			{ initialProps: 'initial' }
		);
		
		expect(result.current.host).to.equal(initialHost);
		
		await rerender('updated');
		expect(result.current.host).to.equal(initialHost);
		expect(result.current.value).to.equal('updated');
	});

	it('host element is same reference across multiple calls', async () => {
		const hostReferences: HTMLElement[] = [];
		
		const captureMultipleHosts = () => {
			hostReferences.push(useHostElement());
			return useHostElement();
		};
		
		const { host } = await renderHook(() => captureMultipleHosts());
		expect(hostReferences).to.have.lengthOf(1);
		expect(hostReferences[0]).to.equal(host);
		expect(result.current).to.equal(host);
	});

	it('host element accessible with wrapper', async () => {
		const wrapperElement = 'test-wrapper';
		const TestWrapper = () => html`<div class="${wrapperElement}"></div>`;
		
		const { host } = await renderHook(
			() => useHostElement(),
			{
				wrapper: (el) => html`<div class="wrapper">${el}</div>`,
			}
		);
		
		expect(host).to.be.instanceOf(HTMLElement);
		expect(host.tagName.toLowerCase()).to.include('render-hook');
	});

	it('unmount removes host element from DOM', async () => {
		const { host, unmount } = await renderHook(() => useHostElement());
		expect(host.isConnected).to.be.true;
		
		unmount();
		expect(host.isConnected).to.be.false;
	});

	it('host element supports custom properties', async () => {
		const { host } = await renderHook(() => {
			const h = useHostElement();
			(h as any).testProperty = 'test-value';
			return h;
		});
		
		expect((host as any).testProperty).to.equal('test-value');
	});

	it('works with typed host element', async () => {
		const { host } = await renderHook(() => useHostWithType());
		expect(host).to.be.instanceOf(HTMLButtonElement);
		expect(host.tagName).to.equal('BUTTON');
	});
});
