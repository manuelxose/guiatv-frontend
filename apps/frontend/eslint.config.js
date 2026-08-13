// @ts-check
// Minimal Angular ESLint flat config using the official recommended presets
// from @angular-eslint and typescript-eslint. No custom/elaborate ruleset —
// this wires up the standard recommended rules for TS + Angular templates.
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angularEslint = require('@angular-eslint/eslint-plugin');
const angularEslintTemplate = require('@angular-eslint/eslint-plugin-template');
const angularTemplateParser = require('@angular-eslint/template-parser');

module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'node_modules/**',
      'coverage/**',
      'src/environments/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      '@angular-eslint': angularEslint,
    },
    processor: angularEslintTemplate.processors?.['extract-inline-html'],
    rules: {
      ...angularEslint.configs.recommended.rules,
      // Angular CLI/community convention: app-* prefix for selectors.
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      // Large pre-existing codebase: keep these as warnings, not hard errors.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@angular-eslint/use-lifecycle-interface': 'warn',
      // Constructor injection and DOM-named outputs are established public
      // patterns across the legacy surface. Keep the migration debt visible
      // without making an all-at-once DI/API rewrite a release blocker.
      '@angular-eslint/prefer-inject': 'warn',
      '@angular-eslint/no-output-native': 'warn',
      // MarkdownPipe loads DOMPurify only in the browser. A static import
      // would execute the DOM-oriented package during SSR initialization.
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularEslintTemplate,
    },
    rules: {
      ...angularEslintTemplate.configs.recommended.rules,
      ...angularEslintTemplate.configs.accessibility.rules,
    },
  },
);
