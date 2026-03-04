import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

import NodePanel from './NodePanel'
import { logger } from '../utils/logger'
import type { StorageAdapter } from '../types/adapters'
import { showSuccess, showError } from '../utils/notifications'

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

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
    // Agent nodes are expanded by default - click to collapse then expand
    fireEvent.click(toggleButton!)
    expect(screen.queryByText('Agent')).not.toBeInTheDocument()
    fireEvent.click(toggleButton!)
    expect(screen.getByText('Agent')).toBeInTheDocument()
  })

  it('should show ADK Agent in palette when agent nodes expanded', () => {
    render(<NodePanel />)

    // Agent nodes are expanded by default
    expect(screen.getByText('ADK Agent')).toBeInTheDocument()
    expect(screen.getByText(/Google ADK agent/)).toBeInTheDocument()
  })

  it('should handle drag start for ADK Agent with agent_type and adk_config', () => {
    render(<NodePanel />)

    const adkAgentNode = screen.getByText('ADK Agent').closest('div')
    expect(adkAgentNode).toBeDefined()

    const dragEvent = new Event('dragstart') as any
    dragEvent.dataTransfer = {
      setData: jest.fn(),
      effectAllowed: '',
    }

    fireEvent.dragStart(adkAgentNode!, dragEvent)

    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith('application/reactflow', 'agent')
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith('application/custom-agent', expect.any(String))
    const customAgentJson = dragEvent.dataTransfer.setData.mock.calls.find(
      (c: [string, string]) => c[0] === 'application/custom-agent'
    )?.[1]
    const parsed = JSON.parse(customAgentJson!)
    expect(parsed.agent_config).toMatchObject({ agent_type: 'adk', adk_config: { name: 'adk_agent' } })
    expect(parsed.label).toBe('ADK Agent')
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

    // Agent nodes are expanded by default
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

    // Agent nodes are expanded by default
    await waitForWithTimeout(() => {
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

  it('should update custom agent nodes when storage event fires', async () => {
    render(<NodePanel />)

    const newNodes = [{ id: 'custom-2', label: 'New Agent' }]
    const storageEvent = new StorageEvent('storage', {
      key: 'customAgentNodes',
      newValue: JSON.stringify(newNodes),
    })

    window.dispatchEvent(storageEvent)

    // Agent nodes are expanded by default; wait for state update
    await waitForWithTimeout(() => {
      expect(screen.getByText('New Agent')).toBeInTheDocument()
    })
  })

  it('should handle custom storage event for same-window updates', async () => {
    render(<NodePanel />)

    const newNodes = [{ id: 'custom-3', label: 'Updated Agent' }]
    localStorage.setItem('customAgentNodes', JSON.stringify(newNodes))

    const customEvent = new Event('customAgentNodesUpdated')
    window.dispatchEvent(customEvent)

    // Agent nodes are expanded by default; wait for state update
    await waitForWithTimeout(() => {
      expect(screen.getByText('Updated Agent')).toBeInTheDocument()
    })
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

    it('should handle storage event with injected storage', async () => {
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

      // Simulate storage event (uses event.newValue, not getItem)
      const storageEvent = new StorageEvent('storage', {
        key: 'customAgentNodes',
        newValue: JSON.stringify([{ id: 'custom-1', label: 'New Agent' }]),
      })

      window.dispatchEvent(storageEvent)

      // Agent nodes are expanded by default; wait for state update
      await waitForWithTimeout(() => {
        expect(screen.getByText('New Agent')).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle storage event with null newValue', () => {
      render(<NodePanel />)

      const storageEvent = new StorageEvent('storage', {
        key: 'customAgentNodes',
        newValue: null,
      })

      window.dispatchEvent(storageEvent)

      // Should handle gracefully
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should handle storage event with empty string newValue', () => {
      render(<NodePanel />)

      const storageEvent = new StorageEvent('storage', {
        key: 'customAgentNodes',
        newValue: '',
      })

      window.dispatchEvent(storageEvent)

      // Should handle gracefully
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should handle storage event with invalid JSON newValue', () => {
      render(<NodePanel />)

      const storageEvent = new StorageEvent('storage', {
        key: 'customAgentNodes',
        newValue: '{invalid json}',
      })

      window.dispatchEvent(storageEvent)

      // Should handle gracefully and log error
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
      expect(logger.error).toHaveBeenCalled()
    })

    it('should handle storage event with non-array parsed value', () => {
      render(<NodePanel />)

      const storageEvent = new StorageEvent('storage', {
        key: 'customAgentNodes',
        newValue: JSON.stringify({ not: 'an array' }),
      })

      window.dispatchEvent(storageEvent)

      // Should handle gracefully - parsed value is not array
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should handle customAgentNodesUpdated event when storage is null', () => {
      render(<NodePanel storage={null} />)

      const customEvent = new Event('customAgentNodesUpdated')
      window.dispatchEvent(customEvent)

      // Should handle gracefully
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should handle storage.getItem returning non-string value', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(123 as any), // Non-string
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(<NodePanel storage={mockStorage} />)

      // Should handle gracefully
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should handle storage.getItem returning empty string', () => {
      const mockStorage: StorageAdapter = {
        getItem: jest.fn().mockReturnValue(''),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }

      render(<NodePanel storage={mockStorage} />)

      // Should handle gracefully - empty string is falsy
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should show Import Agent button when agent nodes expanded', () => {
      render(<NodePanel />)

      expect(screen.getByRole('button', { name: /import agent/i })).toBeInTheDocument()
    })

    it('should import agent config from JSON file', async () => {
      const agentConfig = {
        label: 'Imported ADK Agent',
        description: 'Test import',
        agent_config: {
          agent_type: 'adk',
          adk_config: { name: 'imported_agent', description: 'From file' },
          model: 'gemini-1.5-pro',
        },
        type: 'agent',
      }
      const file = new File([JSON.stringify(agentConfig)], 'agent.json', { type: 'application/json' })

      render(<NodePanel />)

      const fileInput = screen.getByTestId('import-agent-file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitForWithTimeout(() => {
        expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining('Imported ADK Agent'))
      })

      expect(screen.getByText('Imported ADK Agent')).toBeInTheDocument()
    })

    it('should show error when importing invalid JSON', async () => {
      const file = new File(['invalid json {'], 'agent.json', { type: 'application/json' })

      render(<NodePanel />)

      const fileInput = screen.getByTestId('import-agent-file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalled()
      })
    })

    it('should show error when importing JSON without agent_config', async () => {
      const file = new File([JSON.stringify({ label: 'No config' })], 'agent.json', { type: 'application/json' })

      render(<NodePanel />)

      const fileInput = screen.getByTestId('import-agent-file-input')
      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith('Invalid agent config: missing agent_config')
      })
    })

    it('should handle all categories being expanded', () => {
      render(<NodePanel />)

      // Expand workflow and data; agent nodes are expanded by default
      const workflowToggle = screen.getByText('Workflow Nodes').closest('button')
      const dataToggle = screen.getByText('Data Nodes').closest('button')

      fireEvent.click(workflowToggle!)
      fireEvent.click(dataToggle!)

      // All should be visible
      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('Agent')).toBeInTheDocument()
      expect(screen.getByText('ADK Agent')).toBeInTheDocument()
      expect(screen.getByText('GCP Bucket')).toBeInTheDocument()
    })

    it('should handle all categories being collapsed', () => {
      render(<NodePanel />)

      // Collapse agent nodes (expanded by default)
      const agentToggle = screen.getByText('Agent Nodes').closest('button')
      fireEvent.click(agentToggle!)

      // Workflow and data nodes start collapsed; agent nodes now collapsed
      expect(screen.queryByText('Start')).not.toBeInTheDocument()
      expect(screen.queryByText('Agent')).not.toBeInTheDocument()
      expect(screen.queryByText('ADK Agent')).not.toBeInTheDocument()
      expect(screen.queryByText('GCP Bucket')).not.toBeInTheDocument()
    })

    it('should handle custom agent nodes with missing properties', () => {
      const customNodes = [
        { id: 'custom-1' }, // Missing label
        { label: 'Custom 2' }, // Missing id
        { id: 'custom-3', label: 'Custom 3', description: null },
      ]
      localStorage.setItem('customAgentNodes', JSON.stringify(customNodes))

      render(<NodePanel />)

      const toggleButton = screen.getByText('Agent Nodes').closest('button')
      fireEvent.click(toggleButton!)

      // Should handle gracefully
      expect(screen.getByText('Node Palette')).toBeInTheDocument()
    })

    it('should handle window being undefined', () => {
      const originalWindow = global.window
      // @ts-expect-error - window is intentionally undefined for this test
      delete global.window

      // Should not crash
      render(<NodePanel />)

      expect(screen.getByText('Node Palette')).toBeInTheDocument()

      global.window = originalWindow
    })
  })
})
