// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist/**/*'] },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    eslintPluginPrettierRecommended,
    {
        ...eslintConfigPrettier,
        rules: {
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: 'block', next: '*' },
                { blankLine: 'always', prev: '*', next: 'block' },
                { blankLine: 'always', prev: '*', next: 'export' },
            ],
        },
    },
);
