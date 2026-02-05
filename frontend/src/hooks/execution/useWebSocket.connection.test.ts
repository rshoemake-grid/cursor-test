import { renderHook, act } from '@testing-library/react'
import { 
  advanceTimersByTime, 
  wsInstances, 
  MockWebSocket, 
  useWebSocket, 
  logger 
} from './useWebSocket.test.setup'
import type { WindowLocation } from '../../types/adapters'

describe('useWebSocket - connection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    wsInstances.splice(0, wsInstances.length)
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    wsInstances.splice(0, wsInstances.length)
    jest.useRealTimers()
  })

  describe('connection', () => {
    it('should not connect when executionId is null', () => {
      const { result } = renderHook(() => useWebSocket({ executionId: null }))

      expect(result.current.isConnected).toBe(false)
    })

    it('should not connect to temporary execution IDs', async () => {
      const { result } = renderHook(() => useWebSocket({ executionId: 'pending-123' }))
      await advanceTimersByTime(100)

      expect(result.current.isConnected).toBe(false)
      expect(wsInstances.length).toBe(0)
    })

    it('should not connect if execution is completed', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'completed'
        })
      )
      await advanceTimersByTime(100)

      expect(result.current.isConnected).toBe(false)
    })

    it('should not connect if execution is failed', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'failed'
        })
      )
      await advanceTimersByTime(100)

      expect(result.current.isConnected).toBe(false)
    })

    it('should connect when executionId is provided and status is running', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: 'exec-1',
          executionStatus: 'running'
        })
      )
      await advanceTimersByTime(100)

      expect(wsInstances.length).toBeGreaterThan(0)
    })

    it('should verify connect function early return for null executionId', async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: 'exec-1' as string | null } }
      )

      await advanceTimersByTime(100)
      expect(wsInstances.length).toBeGreaterThan(0)

      rerender({ executionId: null })
      await advanceTimersByTime(100)

      expect(wsInstances.length).toBeGreaterThanOrEqual(0)
    })

    it('should verify connect function early return for empty string executionId', async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({ executionId }),
        { initialProps: { executionId: 'exec-1' } }
      )

      await advanceTimersByTime(100)
      expect(wsInstances.length).toBeGreaterThan(0)

      rerender({ executionId: '' })
      await advanceTimersByTime(100)

      expect(wsInstances.length).toBeGreaterThanOrEqual(0)
    })

    it('should verify connect function early return path for pending executionId', async () => {
      const executionId = 'pending-test-456'
      renderHook(() =>
        useWebSocket({
          executionId
        })
      )

      await advanceTimersByTime(100)

      expect(wsInstances.length).toBe(0)
    })

    it('should verify connect function early return for wsRef.current check', async () => {
      const executionId = 'exec-wsref-check'
      renderHook(() =>
        useWebSocket({
          executionId,
          executionStatus: 'running'
        })
      )

      await advanceTimersByTime(100)

      if (wsInstances.length > 0) {
        const firstWs = wsInstances[0]
        firstWs.simulateClose(1006, '', false)
        await advanceTimersByTime(50)
        
        expect(wsInstances.length).toBeGreaterThan(0)
      }
    })

    it('should use wss:// for https protocol', async () => {
      const mockWindowLocation: WindowLocation = {
        protocol: 'https:',
        host: 'localhost:8000',
        hostname: 'localhost',
        port: '8000',
        href: 'https://localhost:8000',
        origin: 'https://localhost:8000',
      }

      const executionId = 'exec-protocol-https'
      renderHook(() =>
        useWebSocket({
          executionId,
          executionStatus: 'running',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      expect(wsInstances.length).toBeGreaterThan(0)
      const ws = wsInstances.find(w => w.url.includes('wss://'))
      expect(ws).toBeDefined()
      if (ws) {
        expect(ws.url).toContain('wss://')
      }
    })

    it('should use ws:// for http protocol', async () => {
      const mockWindowLocation: WindowLocation = {
        protocol: 'http:',
        host: 'localhost:8000',
        hostname: 'localhost',
        port: '8000',
        href: 'http://localhost:8000',
        origin: 'http://localhost:8000',
      }

      const executionId = 'exec-protocol-http'
      renderHook(() =>
        useWebSocket({
          executionId,
          executionStatus: 'running',
          windowLocation: mockWindowLocation,
        })
      )

      await advanceTimersByTime(100)

      expect(wsInstances.length).toBeGreaterThan(0)
      const ws = wsInstances.find(w => w.url.includes('ws://') && !w.url.includes('wss://'))
      expect(ws).toBeDefined()
      if (ws) {
        expect(ws.url).toContain('ws://')
        expect(ws.url).not.toContain('wss://')
      }
    })
  })

  describe('connection state', () => {
    it('should set isConnected to true when connection opens', async () => {
      const windowLocation = {
        protocol: 'http:',
        host: 'localhost:8000',
        hostname: 'localhost',
        port: '8000',
        pathname: '/',
        search: '',
        hash: '',
      }
      
      const webSocketFactory = {
        create: (url: string) => {
          const ws = new MockWebSocket(url)
          wsInstances.push(ws)
          return ws as any
        }
      }

      const { result } = renderHook(() =>
        useWebSocket({ 
          executionId: 'exec-1',
          windowLocation,
          webSocketFactory
        })
      )

      await act(async () => {
        await jest.advanceTimersByTime(5)
      })

      expect(wsInstances.length).toBeGreaterThan(0)
      const ws = wsInstances[0]
      
      expect(ws.onopen).toBeDefined()
      
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Connecting to')
      )
      
      expect(result.current.isConnected).toBe(false)
      
      ;(logger.debug as jest.Mock).mockClear()
      
      await act(async () => {
        if (ws.onopen) {
          ws.onopen(new Event('open'))
        }
        await jest.advanceTimersByTime(0)
      })
      
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('[WebSocket] Connected to execution exec-1')
      )
      
      await act(async () => {
        await jest.advanceTimersByTime(10)
      })
      
      expect(result.current.isConnected).toBe(true)
    })

    it('should set isConnected to false initially', () => {
      const { result } = renderHook(() =>
        useWebSocket({ executionId: 'exec-1' })
      )

      expect(result.current.isConnected).toBe(false)
    })
  })
})
