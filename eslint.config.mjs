import cfg from '@neovici/cfg/eslint/index.mjs';

export default [
	...cfg,
	{
		ignores: ['dist/', 'coverage/'],
	},
	{
		files: ['test/**/*.test.+(t|j)s'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
];
