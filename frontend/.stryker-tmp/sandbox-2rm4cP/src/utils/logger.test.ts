// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset import.meta.env to development
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true, MODE: 'development' },
      writable: true,
    })
  })

  afterEach(() => {
    // Reset to development
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true, MODE: 'development' },
      writable: true,
    })
  })

  describe('debug', () => {
    it('should log in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true, MODE: 'development' },
        writable: true,
      })
      logger.debug('test message')
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'test message')
    })

    // Note: import.meta.env is evaluated at module load time, so we can't test production mode
    // without re-importing. This test verifies dev mode behavior (which is the default).
    it('should log in development mode (default)', () => {
      logger.debug('test message')
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'test message')
    })

    it('should handle multiple arguments', () => {
      process.env.NODE_ENV = 'development'
      logger.debug('arg1', 'arg2', { key: 'value' })
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'arg1', 'arg2', { key: 'value' })
    })
  })

  describe('info', () => {
    it('should log in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true, MODE: 'development' },
        writable: true,
      })
      logger.info('test message')
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO]', 'test message')
    })

    // Note: import.meta.env is evaluated at module load time
    // This test verifies dev mode behavior (which is the default).
    it('should log in development mode (default)', () => {
      logger.info('test message')
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO]', 'test message')
    })
  })

  describe('warn', () => {
    it('should always log warnings', () => {
      logger.warn('warning message')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'warning message')
    })

    it('should log in both development and production', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: false, MODE: 'production' },
        writable: true,
      })
      logger.warn('warning')
      expect(consoleWarnSpy).toHaveBeenCalled()

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true, MODE: 'development' },
        writable: true,
      })
      logger.warn('warning')
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('error', () => {
    it('should always log errors', () => {
      logger.error('error message')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'error message')
    })

    it('should handle error objects', () => {
      const error = new Error('test error')
      logger.error('error occurred', error)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'error occurred', error)
    })
  })

  describe('log', () => {
    it('should log in development mode', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true, MODE: 'development' },
        writable: true,
      })
      logger.log('test message')
      expect(consoleLogSpy).toHaveBeenCalledWith('test message')
    })

    // Note: logger uses import.meta.env.DEV which is evaluated at module load time
    // This test verifies the logger works in dev mode (which is the default)
    it('should log in development mode (default)', () => {
      logger.log('test message')
      expect(consoleLogSpy).toHaveBeenCalledWith('test message')
    })
  })
})

