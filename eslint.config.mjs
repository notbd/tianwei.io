import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()

export default antfu(
  {
    react: true,
    ignores: [
      '**/tailwind.config.js',
    ],
  },

  {
    rules: {
      // use `type` for type definitions instead of `interface`
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
  },

  // Extend additional plugins using `FlatCompat()`
  ...compat.config({
    extends: [
      'plugin:tailwindcss/recommended',
      'plugin:@next/next/recommended',
    ],
  }),
)
