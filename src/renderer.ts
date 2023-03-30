import { RendererProps, Wrapper } from './types';
import { component } from 'haunted';
import { unsafeStatic, html } from 'lit-html/static.js';
import { litFixtureSync } from '@open-wc/testing';
import { TemplateResult } from 'lit-html';

interface HarnessProps<TProps> {
	hookProps?: TProps;
	render: (hookProps?: TProps) => void;
}
const tagName = 'render-hooklt';
const RenderHook = <T>({ render, hookProps }: HarnessProps<T>) => {
	render(hookProps);
};
customElements.define(
	tagName,
	component<HarnessProps<unknown>>(RenderHook, { useShadowDOM: false })
);

export function mkRenderer<TProps, TResult>(
	{ callback, setValue, setError }: RendererProps<TProps, TResult>,
	wrapper: Wrapper<TProps> = (el: TemplateResult) => el
) {
	const render = (hookProps: TProps) => {
		try {
			setValue(callback(hookProps));
		} catch (e) {
			setError(e as Error);
		}
	};
	return (props?: TProps) => {
		const root = litFixtureSync(
			wrapper(
				html`<${unsafeStatic(tagName)}
					.render=${render}
					.hookProps=${props}
				></${unsafeStatic(tagName)}>`,
				props
			)
		);
		const el = (
			root.matches(tagName) ? root : root.querySelector(tagName)
		) as HTMLElement & HarnessProps<TProps>;
		return { root, el };
	};
}
