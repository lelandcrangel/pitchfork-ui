import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      '**/mockServiceWorker.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: [
      'apps/docs/.storybook/**/*.{ts,tsx}',
      'packages/react/src/components/Icon/Icon.tsx',
      // useToast/toast and the context hook are legitimate public API, not refresh hazards.
      'packages/react/src/components/Toast/Toast.tsx',
      'apps/demo/src/context/NotificationContext.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ['packages/react/src/**/*.tsx'],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // APG patterns with intentionally focusable non-interactive roles:
      // window-splitter separator (Resizable) and tabpanel (Tabs).
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['separator', 'tabpanel'] }],
    },
  },
);
