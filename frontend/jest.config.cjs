module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
  testPathIgnorePatterns: process.env.STRYKER_RUNNING === '1'
    ? [
        'useMarketplaceData\\.test\\.jsx$',
        'useWorkflowExecution\\.test\\.jsx$',
        'useWebSocket\\.mutation\\.advanced\\.test\\.jsx$',
        'InputNodeEditor\\.test\\.jsx$',
        'useMarketplaceIntegration\\.test\\.jsx$',
        'useWorkflowUpdates\\.test\\.jsx$',
        'useCanvasEvents\\.test\\.jsx$',
        'useWebSocket\\.edges\\.comprehensive\\.2\\.test\\.jsx$',
        'PropertyPanel\\.test\\.jsx$',
        'useLLMProviders\\.test\\.jsx$',
        'useAgentDeletion\\.test\\.jsx$',
        'WorkflowTabs\\.test\\.jsx$',
        'useWebSocket\\.mutation\\.kill-remaining\\.test\\.jsx$',
        'detectStryker\\.test\\.jsx$',
        'useMarketplaceData\\.methods\\.test\\.jsx$',
      ]
    : [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.jsx'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/test/**',
    '!src/**/mockData/**',
  ],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'json', 'html'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testTimeout: 180000,
  moduleFileExtensions: ['js', 'jsx', 'json'],
  maxWorkers: process.env.JEST_MAX_WORKERS ? parseInt(process.env.JEST_MAX_WORKERS, 10) : 8,
}
