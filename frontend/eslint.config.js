import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import globals from 'globals'
import { readdirSync } from 'node:fs'

const FEATURES = readdirSync(new URL('./src/features', import.meta.url))

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, reactRefresh.configs.vite()],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    rules: {
      // Regras clássicas de hooks. As regras do React Compiler (configs.flat.recommended) ficam para depois.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }]
    }
  },
  {
    // Outra feature só pelo index dela (a lista do que cada uma pode usar fica em src/architecture.test.js).
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/features/*/**'], message: 'Importe a feature pelo index: @/features/<nome>.' }] }
      ]
    }
  },
  ...FEATURES.map((feature) => ({
    // Dentro da própria feature, os caminhos completos valem.
    files: [`src/features/${feature}/**/*.{js,jsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/**', `!@/features/${feature}/**`],
              message: 'Importe a feature pelo index: @/features/<nome>.'
            }
          ]
        }
      ]
    }
  })),
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node }
  }
])
