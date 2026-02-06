import { mkResult, type RenderResult } from './result';
import { mkRenderer } from './renderer';
import { waitUntil } from './wait-until';
import type { RenderHookOptions } from './types';

const tillNextUpdate =
	<T>(addResolver: ReturnType<typeof mkResult<T>>['addResolver']) =>
	(message?: string, options?: { interval?: number; timeout?: number }) => {
		let updated = false;
		addResolver(() => {
			updated = true;
		});
		return waitUntil(() => updated, message, options);
	};

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
