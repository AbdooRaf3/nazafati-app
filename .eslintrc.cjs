module.exports = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
	plugins: [
		'@typescript-eslint',
		'react-refresh',
	],
	rules: {
		'no-undef': 'off',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'warn',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
		],
		'@typescript-eslint/no-explicit-any': 'warn',
		'react-refresh/only-export-components': 'off',
	},
	ignorePatterns: ['scripts/**'],
};
