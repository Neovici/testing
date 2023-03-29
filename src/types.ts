import type { TemplateResult } from 'lit-html';

export type Renderer<TProps> = {
	render: (props?: TProps) => void;
	rerender: (props?: TProps) => void;
	unmount: () => void;
};

export type RendererProps<TProps, TResult> = {
	callback: (props: TProps) => TResult;
	setError: (error: Error) => void;
	setValue: (value: TResult) => void;
};

export type Wrapper<TProps> = (
	el: TemplateResult,
	props?: TProps
) => TemplateResult;

export type RendererOptions<TProps> = {
	wrapper?: Wrapper<TProps>;
};

export type RenderResult<TValue> = {
	readonly all: Array<TValue | Error>;
	readonly current: TValue;
	readonly error?: Error;
};

export type RenderHookOptions<TProps> = {
	initialProps?: TProps;
} & RendererOptions<TProps>;
