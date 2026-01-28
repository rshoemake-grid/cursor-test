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

