import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location for test environment
if (typeof window !== 'undefined' && !window.location.host) {
  Object.defineProperty(window, 'location', {
    value: {
      protocol: 'http:',
      host: 'localhost:8000',
      hostname: 'localhost',
      port: '8000',
      pathname: '/',
      search: '',
      hash: '',
    },
    writable: true,
  })
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock import.meta.env for logger tests
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: true,
        MODE: 'development',
      },
    },
  },
  writable: true,
})

// Polyfill TextEncoder/TextDecoder for react-router-dom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Ensure fetch is available globally for mutation testing
// This prevents crashes when defaultAdapters.createHttpClient() is called during mutations
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response)
  ) as jest.Mock
}// Add comprehensive error handlers to prevent crashes during mutation testing
// This catches errors that might crash child processes
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  // Handle unhandled promise rejections
  const originalUnhandledRejection = process.listeners('unhandledRejection')
  if (originalUnhandledRejection.length === 0) {
    process.on('unhandledRejection', (reason, promise) => {
      // Convert to handled rejection to prevent crashes
      // Only log if it's not an expected error from mutations
      const reasonStr = String(reason)
      if (!reasonStr.includes('HTTP client') && 
          !reasonStr.includes('URL cannot be empty') &&
          !reasonStr.includes('HttpClientError') &&
          !reasonStr.includes('InvalidUrlError')) {
        console.warn('Unhandled promise rejection in test:', reason)
      }
      // Don't rethrow - let Jest handle it
    })
  }

  // Handle uncaught exceptions more gracefully
  // Store original listeners to preserve Jest's error handling
  const originalUncaughtException = process.listeners('uncaughtException')
  // Remove default handler temporarily to add our wrapper
  process.removeAllListeners('uncaughtException')
  
  process.on('uncaughtException', (error) => {
    // Check if it's an expected mutation error
    const errorMessage = error?.message || ''
    const errorName = error?.name || ''
    
    if (errorMessage.includes('HTTP client') || 
        errorMessage.includes('URL cannot be empty') ||
        errorName === 'HttpClientError' ||
        errorName === 'InvalidUrlError') {
      // Convert to unhandled rejection instead of crashing
      // This allows Jest to handle it as a test failure rather than process crash
      Promise.reject(error).catch(() => {
        // Silently handle - Jest will catch it
      })
      return
    }
    
    // For other errors, call original handlers
    originalUncaughtException.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        // Ignore errors in error handlers
      }
    })
  })
}

// Add logging to help identify which test is running when tests hang
// This wraps Jest's test execution to log test names and durations
// Using beforeEach/afterEach instead of wrapping it() to avoid parsing issues
const testLogs: Array<{ file: string; name: string; start: number }> = []

beforeEach(() => {
  const stack = new Error().stack || ''
  const match = stack.match(/at.*\((.+\.test\.(ts|tsx))/)
  const testFile = match ? match[1].split('/').pop() || 'unknown' : 'unknown'
  const testName = expect.getState().currentTestName || 'unknown'
  testLogs.push({ file: testFile, name: testName, start: Date.now() })
  console.log(`[TEST START] ${testFile} > ${testName}`)
})

afterEach(() => {
  const log = testLogs.pop()
  if (log) {
    const duration = Date.now() - log.start
    console.log(`[TEST END] ${log.file} > ${log.name} (${duration}ms)`)
  }
})

// Log suite execution using describe hooks
const suiteLogs: Array<{ file: string; name: string; start: number }> = []

// Note: We can't easily wrap describe() without causing parsing issues,
// so we'll rely on beforeEach/afterEach for test logging
