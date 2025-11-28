import {type FlatXoConfig} from 'xo';

const xoConfig: FlatXoConfig = [
  {
    space: true,
    react: true,
    prettier: true,
    rules: {
      'react/react-in-jsx-scope': 0,
    },
  },
  {
    files: ['xo.config.ts', 'uno.config.ts', 'vite.config.ts'],
    // Xo doesn't play nicely with tsconfig references, so set the tsconfig manually here
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.node.json',
      },
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          case: 'pascalCase',
        },
      ],
    },
    // Xo doesn't play nicely with tsconfig references, so set the tsconfig manually here
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.app.json',
      },
    },
  },
];

export default xoConfig;
