module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
  testPathIgnorePatterns:
    process.env.STRYKER_RUNNING === '1'
      ? [
          'useMarketplaceData\\.test\\.js$',
          'useWorkflowExecution\\.test\\.js$',
          'useWebSocket\\.mutation\\.advanced\\.test\\.js$',
          'InputNodeEditor\\.test\\.jsx$',
          'useMarketplaceIntegration\\.test\\.js$',
          'useWorkflowUpdates\\.test\\.js$',
          'useCanvasEvents\\.test\\.js$',
          'useWebSocket\\.edges\\.comprehensive\\.2\\.test\\.js$',
          'PropertyPanel\\.test\\.jsx$',
          'useLLMProviders\\.test\\.js$',
          'useAgentDeletion\\.test\\.js$',
          'WorkflowTabs\\.test\\.jsx$',
          'useWebSocket\\.mutation\\.kill-remaining\\.test\\.js$',
          'detectStryker\\.test\\.js$',
          'useMarketplaceData\\.methods\\.test\\.js$',
        ]
      : [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.js'],
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
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testTimeout: 180000,
  moduleFileExtensions: ['js', 'jsx', 'json'],
  maxWorkers: process.env.JEST_MAX_WORKERS ? parseInt(process.env.JEST_MAX_WORKERS) : 8,
}
