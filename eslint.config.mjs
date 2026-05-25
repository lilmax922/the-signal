import antfu from '@antfu/eslint-config'

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(antfu({
  type: 'app',
  vue: true,
  typescript: true,
  formatters: true,
  ignores: [
    'agents/**/*.md',
    'context/**/*.md',
    'pnpm-*',
    'tsconfig.json',
    'server/database/migrations/*',
  ],
}, {
  rules: {
    'ts/no-redeclare': 'off',
    'ts/consistent-type-definitions': ['error', 'type'],
    'no-console': ['warn'],
    'node/no-process-env': ['error'],
    'node/prefer-global/process': ['off'],
    'unicorn/filename-case': ['error', {
      case: 'kebabCase',
      ignore: ['README.md'],
    }],
  },
}, {
  files: ['**/*.vue'],
  rules: {
    'vue/max-attributes-per-line': ['error', {
      singleline: {
        max: 2,
      },
      multiline: {
        max: 1,
      },
    }],
  },
}))
