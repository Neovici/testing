import { RendererProps, Wrapper } from './types';
import { component, html } from 'haunted';
import { litFixtureSync } from '@open-wc/testing';
import { TemplateResult } from 'lit-html';

interface HarnessProps<TProps> {
	hookProps?: TProps;
	render: (hookProps?: TProps) => void;
}
const RenderHook = <T>({ render, hookProps }: HarnessProps<T>) => {
	render(hookProps);
};
customElements.define(
	'render-hook',
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
				html`<render-hook .render=${render} .hookProps=${props}></render-hook>`,
				props
			)
		);
		const el = root.querySelector('render-hook') as HTMLElement &
			HarnessProps<TProps>;
		return { root, el };
	};
}
