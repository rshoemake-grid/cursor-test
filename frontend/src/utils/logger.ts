// Use process.env for compatibility with both Jest and Vite
// In Vite, NODE_ENV should be set to 'development' for dev mode
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },
  
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args)
    }
  },
}
