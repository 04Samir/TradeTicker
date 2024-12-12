// @ts-check
import eslint from '@eslint/js';
import eslintConfigJquery from 'eslint-config-jquery';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/**/*', '**/public/js/lib/**/*'],
    },
    {
        extends: [
            eslint.configs.recommended,
            tseslint.configs.recommended,
            eslintPluginPrettierRecommended,
        ],
        ...eslintConfigPrettier,
        ...eslintConfigJquery,
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: 'block', next: '*' },
                { blankLine: 'always', prev: '*', next: 'block' },
                { blankLine: 'always', prev: '*', next: 'export' },
            ],
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.jquery,
            },
        },
    },
);
