module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', 'build', '.eslintrc.cjs', 'coverage', '.stryker-tmp'],
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.test.shared.jsx',
        '**/*.test.shared.js',
        '**/test/**/*.js',
        '**/test/**/*.jsx',
      ],
      env: { browser: true, es2020: true, jest: true, node: true },
      rules: {
        'no-unused-vars': [
          'warn',
          { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
        ],
      },
    },
    {
      files: ['src/setupProxy.js'],
      env: { node: true },
    },
    {
      files: ['src/utils/logger.js'],
      env: { browser: true, node: true },
    },
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: true,
    babelOptions: {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
      plugins: [
        [
          'babel-plugin-transform-import-meta',
          {
            module: 'ES6',
          },
        ],
      ],
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', 'react-refresh'],
  settings: { react: { version: 'detect' } },
  rules: {
    'react/jsx-uses-vars': 'error',
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['../hooks/use[A-Z]*'],
            message:
              "Use domain-based imports instead of direct hook imports. Example: import { useWorkflowExecution } from '../hooks/execution'.",
          },
        ],
        paths: [
          {
            name: '../hooks/useExecutionManagement',
            message: "Use domain import: import { useExecutionManagement } from '../hooks/execution'",
          },
          {
            name: '../hooks/useWorkflowExecution',
            message: "Use domain import: import { useWorkflowExecution } from '../hooks/execution'",
          },
          {
            name: '../hooks/useWebSocket',
            message: "Use domain import: import { useWebSocket } from '../hooks/execution'",
          },
          {
            name: '../hooks/useWorkflowAPI',
            message: "Use domain import: import { useWorkflowAPI } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useWorkflowState',
            message: "Use domain import: import { useWorkflowState } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useWorkflowLoader',
            message: "Use domain import: import { useWorkflowLoader } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useWorkflowPersistence',
            message: "Use domain import: import { useWorkflowPersistence } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useWorkflowUpdates',
            message: "Use domain import: import { useWorkflowUpdates } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useWorkflowUpdateHandler',
            message: "Use domain import: import { useWorkflowUpdateHandler } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useWorkflowDeletion',
            message: "Use domain import: import { useWorkflowDeletion } from '../hooks/workflow'",
          },
          {
            name: '../hooks/useMarketplaceData',
            message: "Use domain import: import { useMarketplaceData } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useMarketplaceIntegration',
            message: "Use domain import: import { useMarketplaceIntegration } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useMarketplacePublishing',
            message: "Use domain import: import { useMarketplacePublishing } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useMarketplaceDialog',
            message: "Use domain import: import { useMarketplaceDialog } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useTemplateOperations',
            message: "Use domain import: import { useTemplateOperations } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useTemplateUsage',
            message: "Use domain import: import { useTemplateUsage } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useAgentDeletion',
            message: "Use domain import: import { useAgentDeletion } from '../hooks/marketplace'",
          },
          {
            name: '../hooks/useTabOperations',
            message: "Use domain import: import { useTabOperations } from '../hooks/tabs'",
          },
          {
            name: '../hooks/useTabCreation',
            message: "Use domain import: import { useTabCreation } from '../hooks/tabs'",
          },
          {
            name: '../hooks/useTabClosing',
            message: "Use domain import: import { useTabClosing } from '../hooks/tabs'",
          },
          {
            name: '../hooks/useTabRenaming',
            message: "Use domain import: import { useTabRenaming } from '../hooks/tabs'",
          },
          {
            name: '../hooks/useTabWorkflowSync',
            message: "Use domain import: import { useTabWorkflowSync } from '../hooks/tabs'",
          },
          {
            name: '../hooks/useTabInitialization',
            message: "Use domain import: import { useTabInitialization } from '../hooks/tabs'",
          },
          {
            name: '../hooks/useNodeOperations',
            message: "Use domain import: import { useNodeOperations } from '../hooks/nodes'",
          },
          {
            name: '../hooks/useNodeSelection',
            message: "Use domain import: import { useNodeSelection } from '../hooks/nodes'",
          },
          {
            name: '../hooks/useNodeForm',
            message: "Use domain import: import { useNodeForm } from '../hooks/nodes'",
          },
          {
            name: '../hooks/useSelectedNode',
            message: "Use domain import: import { useSelectedNode } from '../hooks/nodes'",
          },
          {
            name: '../hooks/useSelectionManager',
            message: "Use domain import: import { useSelectionManager } from '../hooks/nodes'",
          },
          {
            name: '../hooks/useCanvasEvents',
            message: "Use domain import: import { useCanvasEvents } from '../hooks/ui'",
          },
          {
            name: '../hooks/useContextMenu',
            message: "Use domain import: import { useContextMenu } from '../hooks/ui'",
          },
          {
            name: '../hooks/usePanelState',
            message: "Use domain import: import { usePanelState } from '../hooks/ui'",
          },
          {
            name: '../hooks/useKeyboardShortcuts',
            message: "Use domain import: import { useKeyboardShortcuts } from '../hooks/ui'",
          },
          {
            name: '../hooks/useClipboard',
            message: "Use domain import: import { useClipboard } from '../hooks/ui'",
          },
          {
            name: '../hooks/useLocalStorage',
            message: "Use domain import: import { useLocalStorage } from '../hooks/storage'",
          },
          {
            name: '../hooks/useAutoSave',
            message: "Use domain import: import { useAutoSave } from '../hooks/storage'",
          },
          {
            name: '../hooks/useDraftManagement',
            message: "Use domain import: import { useDraftManagement } from '../hooks/storage'",
          },
          {
            name: '../hooks/useLLMProviders',
            message: "Use domain import: import { useLLMProviders } from '../hooks/providers'",
          },
          {
            name: '../hooks/useProviderManagement',
            message: "Use domain import: import { useProviderManagement } from '../hooks/providers'",
          },
          {
            name: '../hooks/useAuthenticatedApi',
            message: "Use domain import: import { useAuthenticatedApi } from '../hooks/api'",
          },
          {
            name: '../hooks/useFormField',
            message: "Use domain import: import { useFormField } from '../hooks/forms'",
          },
          {
            name: '../hooks/usePublishForm',
            message: "Use domain import: import { usePublishForm } from '../hooks/forms'",
          },
          {
            name: '../hooks/useLoopConfig',
            message: "Use domain import: import { useLoopConfig } from '../hooks/forms'",
          },
        ],
      },
    ],
  },
}
