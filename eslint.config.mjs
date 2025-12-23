import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'
import nextPlugin from '@next/eslint-plugin-next'

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
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },

  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'n/prefer-global/process': ['error', 'always'],
    },
  },

  ...compat.config({
    extends: [
      // `eslint-plugin-tailwindcss` does not support tailwindcss v4 yet
      // ----
      // 'plugin:tailwindcss/recommended',
    ],

    settings: {
      // tailwindcss: {
      //   callees: ['cn', 'classnames', 'clsx', 'ctl', 'cva', 'tv'],
      // },
    },
  }),
)
