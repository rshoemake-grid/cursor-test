import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import NodePanel from './NodePanel'
import { logger } from '../utils/logger'
import type { StorageAdapter } from '../types/adapters'

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }
}))

describe('NodePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render node palette', () => {
    render(<NodePanel />)

    expect(screen.getByText('Node Palette')).toBeInTheDocument()
    expect(screen.getByText(/Drag nodes onto the canvas/)).toBeInTheDocument()
  })

  it('should render workflow nodes category', () => {
    render(<NodePanel />)

    expect(screen.getByText('Workflow Nodes')).toBeInTheDocument()
  })

  it('should toggle workflow nodes category', () => {
    render(<NodePanel />)

    const toggleButton = screen.getByText('Workflow Nodes').closest('button')
    expect(toggleButton).toBeDefined()

    // Initially collapsed
    expect(screen.queryByText('Start')).not.toBeInTheDocument()

    fireEvent.click(toggleButton!)

    // Should expand
    expect(screen.getByText('Start')).toBeInTheDocument()
    expect(screen.getByText('Condition')).toBeInTheDocument()
    expect(screen.getByText('Loop')).toBeInTheDocument()
    expect(screen.getByText('End')).toBeInTheDocument()
  })

  it('should render agent nodes category', () => {
    render(<NodePanel />)

    expect(screen.getByText('Agent Nodes')).toBeInTheDocument()
  })

  it('should toggle agent nodes category', () => {
    render(<NodePanel />)

    const toggleButton = screen.getByText('Agent Nodes').closest('button')
    fireEvent.click(toggleButton!)

    expect(screen.getByText('Agent')).toBeInTheDocument()
  })

  it('should render data nodes category', () => {
    render(<NodePanel />)

    expect(screen.getByText('Data Nodes')).toBeInTheDocument()
  })

  it('should toggle data nodes category', () => {
    render(<NodePanel />)

    const toggleButton = screen.getByText('Data Nodes').closest('button')
    fireEvent.click(toggleButton!)

    expect(screen.getByText('GCP Bucket')).toBeInTheDocument()
    expect(screen.getByText('AWS S3')).toBeInTheDocument()
    expect(screen.getByText('GCP Pub/Sub')).toBeInTheDocument()
    expect(screen.getByText('Local File')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Firebase')).toBeInTheDocument()
    expect(screen.getByText('BigQuery')).toBeInTheDocument()
  })

  it('should load custom agent nodes from localStorage', () => {
    const customNodes = [
      { id: 'custom-1', label: 'Custom Agent 1', description: 'Custom description' },
    ]
    localStorage.setItem('customAgentNodes', JSON.stringify(customNodes))

    render(<NodePanel />)

    const toggleButton = screen.getByText('Agent Nodes').closest('button')
    fireEvent.click(toggleButton!)

    expect(screen.getByText('Custom Agent 1')).toBeInTheDocument()
  })

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('customAgentNodes', 'invalid json')

    render(<NodePanel />)

    // Should not crash
    expect(screen.getByText('Node Palette')).toBeInTheDocument()
    expect(logger.error).toHaveBeenCalled()
  })

  it('should handle drag start for workflow nodes', () => {
    render(<NodePanel />)

    const toggleButton = screen.getByText('Workflow Nodes').closest('button')
    fireEvent.click(toggleButton!)

    const startNode = screen.getByText('Start').closest('div')
    expect(startNode).toBeDefined()

    const dragEvent = new Event('dragstart') as any
    dragEvent.dataTransfer = {
      setData: jest.fn(),
      effectAllowed: '',
    }

    fireEvent.dragStart(startNode!, dragEvent)

    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith('application/reactflow', 'start')
  })

  it('should handle drag start for agent nodes with custom data', async () => {
    const customNodes = [
      { id: 'custom-1', label: 'Custom Agent', description: 'Description' },
    ]
    localStorage.setItem('customAgentNodes', JSON.stringify(customNodes))

    render(<NodePanel />)

    const toggleButton = screen.getByText('Agent Nodes').closest('button')
    fireEvent.click(toggleButton!)

    await waitFor(() => {
      const customAgentNode = screen.getByText('Custom Agent').closest('div')
      expect(customAgentNode).toBeDefined()

      const dragEvent = new Event('dragstart') as any
      dragEvent.dataTransfer = {
        setData: jest.fn(),
        effectAllowed: '',
      }

      fireEvent.dragStart(customAgentNode!, dragEvent)

      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith('application/reactflow', 'agent')
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith('application/custom-agent', expect.any(String))
    })
  })

  it('should display tip message', () => {
    render(<NodePanel />)

    expect(screen.getByText(/💡 Tip/)).toBeInTheDocument()
    expect(screen.getByText(/Connect nodes by dragging/)).toBeInTheDocument()
  })

  it('should update custom agent nodes when storage event fires', () => {
    render(<NodePanel />)

    const newNodes = [{ id: 'custom-2', label: 'New Agent' }]
    const storageEvent = new StorageEvent('storage', {
      key: 'customAgentNodes',
      newValue: JSON.stringify(newNodes),
    })

    window.dispatchEvent(storageEvent)

    const toggleButton = screen.getByText('Agent Nodes').closest('button')
    fireEvent.click(toggleButton!)

    // Should show updated nodes
    expect(screen.getByText('New Agent')).toBeInTheDocument()
  })

  it('should handle custom storage event for same-window updates', () => {
    render(<NodePanel />)

    const newNodes = [{ id: 'custom-3', label: 'Updated Agent' }]
    localStorage.setItem('customAgentNodes', JSON.stringify(newNodes))

    const customEvent = new Event('customAgentNodesUpdated')
    window.dispatchEvent(customEvent)

    const toggleButton = screen.getByText('Agent Nodes').closest('button')
    fireEvent.click(toggleButton!)

    expect(screen.getByText('Updated Agent')).toBeInTheDocument()
  })

  describe('Dependency Injection', () => {
    it('should use injected storage adapter', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([
          { id: 'custom-1', label: 'Custom Agent 1' }
        ])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(<NodePanel storage={mockStorage} />)

      expect(mockStorage.getItem).toHaveBeenCalledWith('customAgentNodes')
    })

    it('should use injected logger', () => {
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      }

      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue('invalid json'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(<NodePanel storage={mockStorage} logger={mockLogger} />)

      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle storage errors gracefully', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error('Storage error')
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      }

      render(<NodePanel storage={mockStorage} logger={mockLogger} />)

      // Should not crash
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle null storage adapter', () => {
      render(<NodePanel storage={null} />)

      // Should not crash
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should use window event listeners for storage events', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      const { unmount } = render(<NodePanel storage={mockStorage} />)

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('customAgentNodesUpdated', expect.any(Function))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('customAgentNodesUpdated', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('should handle storage event with injected storage', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn()
          .mockReturnValueOnce(null) // Initial load
          .mockReturnValueOnce(JSON.stringify([{ id: 'custom-1', label: 'New Agent' }])), // After event
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(<NodePanel storage={mockStorage} />)

      // Simulate storage event
      const storageEvent = new StorageEvent('storage', {
        key: 'customAgentNodes',
        newValue: JSON.stringify([{ id: 'custom-1', label: 'New Agent' }]),
      })

      window.dispatchEvent(storageEvent)

      const toggleButton = screen.getByText('Agent Nodes').closest('button')
      fireEvent.click(toggleButton!)

      // Should show updated nodes
      expect(screen.getByText('New Agent')).toBeInTheDocument()
    })
  })
})
