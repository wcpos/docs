import js from '@eslint/js';
import react from 'eslint-plugin-react';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import markdown from '@eslint/markdown';

export default [
  // JavaScript/JSX files with ESLint recommended rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...js.configs.recommended,
    plugins: {
      react,
      prettier,
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es6,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'react/prop-types': 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
        },
      ],
      ...react.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // MDX files with official ESLint Markdown plugin - NO core ESLint rules
  {
    files: ['**/*.mdx'],
    plugins: {
      markdown,
    },
    language: 'markdown/commonmark',
    rules: {
      // Only Markdown-specific rules, no core ESLint rules
      'markdown/fenced-code-language': 'error',
      'markdown/heading-increment': 'error',
      'markdown/no-duplicate-headings': 'warn',
      'markdown/no-empty-links': 'error',
      'markdown/no-missing-label-refs': 'error',
    },
  },
  prettierConfig,
]; 