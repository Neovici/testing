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
} from 'haunted';

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

describe('render-hook', () => {
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
});
