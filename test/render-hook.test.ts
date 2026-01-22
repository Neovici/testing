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
} from '@pionjs/pion';

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

const useSimple = () => ({ data: 'test' });

const TestContext = createContext<{ value?: string }>({});
customElements.define('test-ctx-provider', TestContext.Provider);

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
		const { host } = await renderHook(() => useSimple());
		expect(host).to.be.instanceOf(HTMLElement);
		expect(host.tagName.toLowerCase()).to.include('render-hook');
	});

	it('can fire custom events on host', async () => {
		const { host } = await renderHook(() => useSimple());
		let eventFired = false;
		
		host.addEventListener('custom-event', () => {
			eventFired = true;
		});
		
		host.dispatchEvent(new Event('custom-event'));
		expect(eventFired).to.be.true;
	});

	it('can listen to native events on host', async () => {
		const { host } = await renderHook(() => useSimple());
		let clickCount = 0;
		
		host.addEventListener('click', () => {
			clickCount++;
		});
		
		host.dispatchEvent(new MouseEvent('click'));
		host.dispatchEvent(new MouseEvent('click'));
		expect(clickCount).to.equal(2);
	});

	it('host element has expected properties', async () => {
		const { host } = await renderHook(() => useSimple());
		expect(host).to.have.property('tagName');
		expect(host).to.have.property('shadowRoot').that.is.null;
		expect(host).to.have.property('appendChild');
		expect(host).to.have.property('removeChild');
	});

	it('host element accessible with wrapper', async () => {
		const { host } = await renderHook(
			() => useSimple(),
			{
				wrapper: (el) => html`<div class="wrapper">${el}</div>`,
			}
		);
		
		expect(host).to.be.instanceOf(HTMLElement);
		expect(host.tagName.toLowerCase()).to.include('render-hook');
	});

	it('unmount removes host element from DOM', async () => {
		const { host, unmount } = await renderHook(() => useSimple());
		expect(host.isConnected).to.be.true;
		
		unmount();
		expect(host.isConnected).to.be.false;
	});

	it('host element supports custom properties', async () => {
		const { host } = await renderHook(() => useSimple());
		(host as any).testProperty = 'test-value';
		expect((host as any).testProperty).to.equal('test-value');
	});

	it('can dispatch and handle events with detail data', async () => {
		const { host } = await renderHook(() => useSimple());
		let receivedData: any = null;
		
		host.addEventListener('data-event', (e: Event) => {
			receivedData = (e as CustomEvent).detail;
		});
		
		host.dispatchEvent(new CustomEvent('data-event', { detail: { foo: 'bar' } }));
		expect(receivedData).to.deep.equal({ foo: 'bar' });
	});

	it('event listeners are cleaned up on unmount', async () => {
		const { host, unmount } = await renderHook(() => useSimple());
		let eventCount = 0;
		
		host.addEventListener('test-event', () => {
			eventCount++;
		});
		
		unmount();
		
		host.dispatchEvent(new Event('test-event'));
		expect(eventCount).to.equal(0);
	});
});
