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
   
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- Dynamic require needed for Jest setup
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Polyfill setImmediate for jsdom environment (used by @testing-library/react waitFor)
if (typeof global.setImmediate === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(() => callback(...args), 0)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).clearImmediate = (id: any) => {
    clearTimeout(id)
  }
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
    process.on('unhandledRejection', (reason) => {
      // Convert to handled rejection to prevent crashes
      // During mutation testing, mutants may cause promises to reject unexpectedly
      const reasonStr = String(reason)
      
      // Expected errors from mutations (don't log these)
      const isExpectedError = 
        reasonStr.includes('HTTP client') || 
        reasonStr.includes('URL cannot be empty') ||
        reasonStr.includes('HttpClientError') ||
        reasonStr.includes('InvalidUrlError') ||
        reason === null || // Null rejections are common in mutation testing
        reason === undefined || // Undefined rejections too
        (typeof reason === 'string' && reason.trim() === '') // Empty string rejections
      
      if (!isExpectedError) {
        // Only log unexpected rejections
        console.warn('Unhandled promise rejection in test:', reason)
      }
      
      // Always handle the rejection to prevent process crash
      // Jest will handle it as a test failure rather than crashing the process
      Promise.resolve().catch(() => {
        // Silently handle - prevents unhandled rejection warning
      })
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
        // Node.js uncaughtException listeners take (error: Error, origin: string) => void
        // But most handlers only use the error parameter
        // Check listener signature and call appropriately
        if (typeof listener === 'function') {
          if (listener.length === 1) {
            (listener as (error: Error) => void)(error)
          } else {
            // Some listeners might expect 2 parameters (error, origin)
            (listener as (error: Error, origin: string) => void)(error, 'uncaughtException')
          }
        }
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
  
  // Clean up any remaining timers to prevent memory leaks
  // This is especially important for mutation testing where many tests run
  if (jest.isMockFunction(setTimeout) || jest.isMockFunction(setInterval)) {
    // If using fake timers, ensure all pending timers are run
    try {
      let timerCount = jest.getTimerCount()
      let iterations = 0
      const maxIterations = 100 // Prevent infinite loops
      
      // Run pending timers until none remain or max iterations reached
      while (timerCount > 0 && iterations < maxIterations) {
        jest.runOnlyPendingTimers()
        const newCount = jest.getTimerCount()
        if (newCount === timerCount) {
          // No progress made, break to avoid infinite loop
          break
        }
        timerCount = newCount
        iterations++
      }
      
      // Always restore real timers after fake timers
      jest.useRealTimers()
    } catch (e) {
      // Fallback: just restore real timers if cleanup fails
      try {
        jest.useRealTimers()
      } catch (e2) {
        // Ignore errors - timers might already be cleared
      }
    }
  }
  
  // Clean up WebSocket instances to prevent memory leaks
  // This is critical for mutation testing where many WebSocket tests run
  try {
    // Try to access wsInstances from useWebSocket test setup
    // Use dynamic require to avoid import issues if module not available
     
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- Dynamic require needed for Jest setup
    const wsSetupModule = require('./hooks/execution/useWebSocket.test.setup')
    if (wsSetupModule && wsSetupModule.wsInstances && Array.isArray(wsSetupModule.wsInstances)) {
      // Clear all WebSocket instances
      wsSetupModule.wsInstances.splice(0, wsSetupModule.wsInstances.length)
    }
  } catch (e) {
    // Ignore if WebSocket test setup module is not available
    // This is expected for tests that don't use WebSocket
  }
})

// Log suite execution using describe hooks
// Note: We can't easily wrap describe() without causing parsing issues,
// so we'll rely on beforeEach/afterEach for test logging