import antfu from '@antfu/eslint-config'

export default antfu(
  {
    stylistic: {
      indent: 2,
      quotes: 'single',
    },
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    react: true,
    nextjs: true,
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },

  {
    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'n/prefer-global/process': ['error', 'always'],
    },
  },
)
