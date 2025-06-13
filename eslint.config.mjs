import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()

export default antfu(
  {
    stylistic: {
      indent: 2,
      quotes: 'single',
    },
    typescript: true,
    react: true,
    ignores: [
      // add files to ignore
    ],
  },

  {
    rules: {
      // use `type` for type definitions instead of `interface`
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'n/prefer-global/process': ['error', 'always'],
    },
  },

  // extend additional plugins using `FlatCompat()`
  ...compat.config({
    extends: [
      'plugin:tailwindcss/recommended',
      'plugin:@next/next/recommended',
    ],

    settings: {
      tailwindcss: {
        // add 'cn' to the default list of functions to have its arguments linted
        callees: ['cn', 'classnames', 'clsx', 'ctl', 'cva', 'tv'],
      },
    },
  }),
)
