import { mkResult, type RenderResult } from './result';
import { mkRenderer } from './renderer';
import type { RenderHookOptions } from './types';

const tillNextUpdate =
	<T>(addResolver: ReturnType<typeof mkResult<T>>['addResolver']) =>
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(_message?: string, _options?: { interval?: number; timeout?: number }) =>
		new Promise<void>((resolve) => {
			addResolver(() => {
				// Allow effects to run after the render completes
				// Effects in Pion run asynchronously, so we need to wait
				setTimeout(resolve, 0);
			});
		});

export interface RenderHookResult<TProps, TResult> {
	result: RenderResult<TResult>;
	rerender: (newProps?: TProps) => Promise<void>;
	unmount: () => void;
	nextUpdate: (message?: string, options?: { interval?: number; timeout?: number }) => Promise<void>;
	host: HTMLElement;
}

export const renderHook = async <TProps, TResult>(
	callback: (props: TProps) => TResult,
	options: RenderHookOptions<TProps> = {}
): Promise<RenderHookResult<TProps, TResult>> => {
	const { result, setValue, setError, addResolver } = mkResult<TResult>();
	const renderProps = { callback, setValue, setError };
	let hookProps = options.initialProps;

	const renderer = mkRenderer(renderProps, options.wrapper);
	const { root, el } = renderer(hookProps);
	const nextUpdate = tillNextUpdate(addResolver);

	const rerenderHook = (newProps = hookProps) => {
		el.hookProps = hookProps = newProps;
		return nextUpdate();
	};

	const unmountHook = () => {
		root.remove();
	};

	await nextUpdate();

	return {
		result,
		rerender: rerenderHook,
		unmount: unmountHook,
		nextUpdate,
		host: el,
	};
};
