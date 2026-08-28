import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * A regra das camadas não é combinado verbal: é lint.
 *
 *   app/      → importa modules e shared
 *   modules/  → importa shared e o index de outros módulos; NUNCA app
 *   shared/   → não importa ninguém
 *   workers/  → importa modules e shared
 */
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'drizzle/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', mode: 'folder' },
        { type: 'modules', pattern: 'src/modules/*', mode: 'folder', capture: ['modulo'] },
        { type: 'shared', pattern: 'src/shared', mode: 'folder' },
        { type: 'workers', pattern: 'src/workers', mode: 'folder' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'off',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message:
            'Camada ${file.type} não pode importar ${dependency.type}. Dependência é sempre para baixo: app → modules → shared.',
          rules: [
            { from: 'app', allow: ['modules', 'shared', 'app'] },
            { from: 'workers', allow: ['modules', 'shared', 'workers'] },
            { from: 'modules', allow: ['shared', 'modules'] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },
  {
    // O domínio é puro: nada de banco, HTTP ou React lá dentro.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*'],
              message: 'domain/ é função pura: sem React, sem Next.',
            },
            {
              group: ['@/shared/db', '@/shared/db/*', 'drizzle-orm', 'drizzle-orm/*', 'pg'],
              message:
                'domain/ não conhece banco. Carregue os dados em application/ e passe por parâmetro.',
            },
            {
              group: ['@/shared/fila', '@/shared/fila/*', 'pg-boss'],
              message: 'domain/ não conhece fila.',
            },
          ],
        },
      ],
    },
  },
  {
    // A UI não fala com o banco. Nunca.
    files: ['src/modules/*/ui/**/*.tsx', 'src/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/shared/db', '@/shared/db/*', 'drizzle-orm', 'drizzle-orm/*', 'pg'],
              message: 'A UI nunca fala com o banco: passe por uma action ou por um caso de uso.',
            },
            {
              group: ['*/infra/*', '@/modules/*/infra/*'],
              message: 'infra/ é privado do módulo. Use o index.ts ou uma action.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Config, script e teste não passam pelas regras que exigem tipo — e o
    // spread precisa vir ANTES de `rules`, senão as regras desligadas voltam.
    files: ['**/*.test.ts', 'e2e/**/*.ts', 'scripts/**/*.mjs', '*.config.ts', '*.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'no-console': 'off',
    },
  },
);
