module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    // Phase 8: Enforce domain-based imports
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          {
            group: ['../hooks/use[A-Z]*'],
            message: 'Use domain-based imports instead of direct hook imports. Example: import { useWorkflowExecution } from \'../hooks/execution\' instead of \'../hooks/useWorkflowExecution\'. See PHASE7_COMPLETE_SUMMARY.md for domain mappings.',
          },
        ],
        paths: [
          // Execution domain
          {
            name: '../hooks/useExecutionManagement',
            message: 'Use domain import: import { useExecutionManagement } from \'../hooks/execution\'',
          },
          {
            name: '../hooks/useWorkflowExecution',
            message: 'Use domain import: import { useWorkflowExecution } from \'../hooks/execution\'',
          },
          {
            name: '../hooks/useWebSocket',
            message: 'Use domain import: import { useWebSocket } from \'../hooks/execution\'',
          },
          // Workflow domain
          {
            name: '../hooks/useWorkflowAPI',
            message: 'Use domain import: import { useWorkflowAPI } from \'../hooks/workflow\'',
          },
          {
            name: '../hooks/useWorkflowState',
            message: 'Use domain import: import { useWorkflowState } from \'../hooks/workflow\'',
          },
          {
            name: '../hooks/useWorkflowLoader',
            message: 'Use domain import: import { useWorkflowLoader } from \'../hooks/workflow\'',
          },
          {
            name: '../hooks/useWorkflowPersistence',
            message: 'Use domain import: import { useWorkflowPersistence } from \'../hooks/workflow\'',
          },
          {
            name: '../hooks/useWorkflowUpdates',
            message: 'Use domain import: import { useWorkflowUpdates } from \'../hooks/workflow\'',
          },
          {
            name: '../hooks/useWorkflowUpdateHandler',
            message: 'Use domain import: import { useWorkflowUpdateHandler } from \'../hooks/workflow\'',
          },
          {
            name: '../hooks/useWorkflowDeletion',
            message: 'Use domain import: import { useWorkflowDeletion } from \'../hooks/workflow\'',
          },
          // Marketplace domain
          {
            name: '../hooks/useMarketplaceData',
            message: 'Use domain import: import { useMarketplaceData } from \'../hooks/marketplace\'',
          },
          {
            name: '../hooks/useMarketplaceIntegration',
            message: 'Use domain import: import { useMarketplaceIntegration } from \'../hooks/marketplace\'',
          },
          {
            name: '../hooks/useMarketplacePublishing',
            message: 'Use domain import: import { useMarketplacePublishing } from \'../hooks/marketplace\'',
          },
          {
            name: '../hooks/useMarketplaceDialog',
            message: 'Use domain import: import { useMarketplaceDialog } from \'../hooks/marketplace\'',
          },
          {
            name: '../hooks/useTemplateOperations',
            message: 'Use domain import: import { useTemplateOperations } from \'../hooks/marketplace\'',
          },
          {
            name: '../hooks/useTemplateUsage',
            message: 'Use domain import: import { useTemplateUsage } from \'../hooks/marketplace\'',
          },
          {
            name: '../hooks/useAgentDeletion',
            message: 'Use domain import: import { useAgentDeletion } from \'../hooks/marketplace\'',
          },
          // Tabs domain
          {
            name: '../hooks/useTabOperations',
            message: 'Use domain import: import { useTabOperations } from \'../hooks/tabs\'',
          },
          {
            name: '../hooks/useTabCreation',
            message: 'Use domain import: import { useTabCreation } from \'../hooks/tabs\'',
          },
          {
            name: '../hooks/useTabClosing',
            message: 'Use domain import: import { useTabClosing } from \'../hooks/tabs\'',
          },
          {
            name: '../hooks/useTabRenaming',
            message: 'Use domain import: import { useTabRenaming } from \'../hooks/tabs\'',
          },
          {
            name: '../hooks/useTabWorkflowSync',
            message: 'Use domain import: import { useTabWorkflowSync } from \'../hooks/tabs\'',
          },
          {
            name: '../hooks/useTabInitialization',
            message: 'Use domain import: import { useTabInitialization } from \'../hooks/tabs\'',
          },
          // Nodes domain
          {
            name: '../hooks/useNodeOperations',
            message: 'Use domain import: import { useNodeOperations } from \'../hooks/nodes\'',
          },
          {
            name: '../hooks/useNodeSelection',
            message: 'Use domain import: import { useNodeSelection } from \'../hooks/nodes\'',
          },
          {
            name: '../hooks/useNodeForm',
            message: 'Use domain import: import { useNodeForm } from \'../hooks/nodes\'',
          },
          {
            name: '../hooks/useSelectedNode',
            message: 'Use domain import: import { useSelectedNode } from \'../hooks/nodes\'',
          },
          {
            name: '../hooks/useSelectionManager',
            message: 'Use domain import: import { useSelectionManager } from \'../hooks/nodes\'',
          },
          // UI domain
          {
            name: '../hooks/useCanvasEvents',
            message: 'Use domain import: import { useCanvasEvents } from \'../hooks/ui\'',
          },
          {
            name: '../hooks/useContextMenu',
            message: 'Use domain import: import { useContextMenu } from \'../hooks/ui\'',
          },
          {
            name: '../hooks/usePanelState',
            message: 'Use domain import: import { usePanelState } from \'../hooks/ui\'',
          },
          {
            name: '../hooks/useKeyboardShortcuts',
            message: 'Use domain import: import { useKeyboardShortcuts } from \'../hooks/ui\'',
          },
          {
            name: '../hooks/useClipboard',
            message: 'Use domain import: import { useClipboard } from \'../hooks/ui\'',
          },
          // Storage domain
          {
            name: '../hooks/useLocalStorage',
            message: 'Use domain import: import { useLocalStorage } from \'../hooks/storage\'',
          },
          {
            name: '../hooks/useAutoSave',
            message: 'Use domain import: import { useAutoSave } from \'../hooks/storage\'',
          },
          {
            name: '../hooks/useDraftManagement',
            message: 'Use domain import: import { useDraftManagement } from \'../hooks/storage\'',
          },
          // Providers domain
          {
            name: '../hooks/useLLMProviders',
            message: 'Use domain import: import { useLLMProviders } from \'../hooks/providers\'',
          },
          {
            name: '../hooks/useProviderManagement',
            message: 'Use domain import: import { useProviderManagement } from \'../hooks/providers\'',
          },
          // API domain
          {
            name: '../hooks/useAuthenticatedApi',
            message: 'Use domain import: import { useAuthenticatedApi } from \'../hooks/api\'',
          },
          // Forms domain
          {
            name: '../hooks/useFormField',
            message: 'Use domain import: import { useFormField } from \'../hooks/forms\'',
          },
          {
            name: '../hooks/usePublishForm',
            message: 'Use domain import: import { usePublishForm } from \'../hooks/forms\'',
          },
          {
            name: '../hooks/useLoopConfig',
            message: 'Use domain import: import { useLoopConfig } from \'../hooks/forms\'',
          },
        ],
      },
    ],
  },
}

