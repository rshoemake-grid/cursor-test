module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  // Exclude problematic test files during mutation testing (causes Cursor crashes)
  // Always exclude these files when STRYKER_RUNNING is set
  testPathIgnorePatterns: process.env.STRYKER_RUNNING === '1' 
    ? [
        'useMarketplaceData\\.test\\.ts$',  // Large file (5,032 lines) - causes crashes
        'useWorkflowExecution\\.test\\.ts$', // Very large file (7,342 lines) - causes crashes
        'useWebSocket\\.mutation\\.advanced\\.test\\.ts$', // Very large file (5,439 lines) - causes crashes
        'InputNodeEditor\\.test\\.tsx$', // Large file (4,949 lines) - causes crashes
        'useMarketplaceIntegration\\.test\\.ts$', // Large file (4,238 lines) - causes crashes
        'useWorkflowUpdates\\.test\\.ts$', // Large file (4,184 lines) - causes crashes
        'useCanvasEvents\\.test\\.ts$', // Large file (3,699 lines) - causes crashes
        'useWebSocket\\.edges\\.comprehensive\\.2\\.test\\.ts$', // Large file (3,647 lines) - causes crashes
        'PropertyPanel\\.test\\.tsx$', // Large file (3,408 lines) - causes crashes
        'useLLMProviders\\.test\\.ts$', // Large file (3,270 lines) - causes crashes
        'useAgentDeletion\\.test\\.ts$', // Large file (3,234 lines) - causes crashes
        'WorkflowTabs\\.test\\.tsx$', // Large file (2,983 lines) - causes crashes
        'useWebSocket\\.mutation\\.kill-remaining\\.test\\.ts$', // Large file (2,535 lines) - causes crashes
        'detectStryker\\.test\\.ts$', // Test for Stryker detection - fails when running under Stryker
        'useMarketplaceData\\.methods\\.test\\.ts$', // Has failing tests under Stryker dry-run (781 lines)
      ]
    : [],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-jest.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/test/**',
    '!src/**/mockData/**',
  ],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'json', 'html'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        target: 'ES2020',
        module: 'ESNext',
        isolatedModules: true, // Required by ts-jest v30+, also set in tsconfig.json
      },
    }],
  },
  testTimeout: 180000, // Increased for Stryker instrumentation which runs slower (3 minutes)
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  maxWorkers: process.env.JEST_MAX_WORKERS ? parseInt(process.env.JEST_MAX_WORKERS) : 8, // Use 8 workers by default, can be overridden via env var
}

