/**
 * Waits until the given predicate returns a truthy value.
 * Calls and awaits the predicate function at the given interval time.
 * Can be used to poll until a certain condition is true.
 *
 * Cloned from @open-wc/testing-helpers to remove the dependency.
 *
 * @param predicate - predicate function which is called each poll interval.
 *   The predicate is awaited, so it can return a promise.
 * @param message - an optional message to display when the condition timed out
 * @param options - timeout and polling interval
 */
export function waitUntil(
	predicate: () => unknown | Promise<unknown>,
	message?: string,
	options: { interval?: number; timeout?: number } = {},
): Promise<void> {
	const { interval = 50, timeout = 1000 } = options;
	const { stack } = new Error();

	return new Promise((resolve, reject) => {
		let timeoutId: ReturnType<typeof setTimeout>;

		setTimeout(() => {
			clearTimeout(timeoutId);
			const error = new Error(
				message
					? `Timeout: ${message}`
					: `waitUntil timed out after ${timeout}ms`,
			);
			error.stack = stack;
			reject(error);
		}, timeout);

		async function nextInterval() {
			try {
				if (await predicate()) {
					resolve();
				} else {
					timeoutId = setTimeout(nextInterval, interval);
				}
			} catch (error) {
				reject(error);
			}
		}
		nextInterval();
	});
}
