import { mkResult } from './result';
import { mkRenderer } from './renderer';
import { waitUntil } from '@open-wc/testing';
import type { RenderHookOptions } from './types';

export const renderHook = <TProps, TResult>(
	callback: (props: TProps) => TResult,
	options: RenderHookOptions<TProps>
) => {
	const { result, setValue, setError, addResolver } = mkResult<TResult>();
	const renderProps = { callback, setValue, setError };
	let hookProps = options.initialProps;

	const renderer = mkRenderer(renderProps, options.wrapper);
	const { root, el } = renderer(hookProps);

	const rerenderHook = (newProps = hookProps) => {
		hookProps = newProps;
		el.hookProps = hookProps;
	};

	const unmountHook = () => {
		root.remove();
	};

	return {
		result,
		rerender: rerenderHook,
		unmount: unmountHook,
		waitForNextUpdate: (
			message?: string,
			options?: { interval?: number; timeout?: number }
		) => {
			let updated = false;
			addResolver(() => {
				updated = true;
			});
			return waitUntil(() => updated, message, options);
		},
	};
};
