import type { RenderResult } from './types';

export function mkResult<TValue>() {
	const results: Array<{ value?: TValue; error?: Error }> = [];
	const resolvers: Array<() => void> = [];

	const result: RenderResult<TValue> = {
		get all() {
			return results.map(({ value, error }) => error ?? (value as TValue));
		},
		get current() {
			const lastResult = results[results.length - 1];
			const value = lastResult?.value;
			const error = lastResult?.error;
			if (error) {
				throw error;
			}
			return value as TValue;
		},
		get error() {
			const lastResult = results[results.length - 1];
			return lastResult?.error;
		},
	};

	const updateResult = (value?: TValue, error?: Error) => {
		results.push({ value, error });
		resolvers.splice(0, resolvers.length).forEach((resolve) => resolve());
	};

	return {
		result,
		addResolver: (resolver: () => void) => {
			resolvers.push(resolver);
		},
		setValue: (value: TValue) => updateResult(value),
		setError: (error: Error) => updateResult(undefined, error),
	};
}
