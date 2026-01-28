/**
 * Tests for useWorkflowPersistence hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'

// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

import { useWorkflowPersistence } from './useWorkflowPersistence'
import { api } from '../api/client'
import { showSuccess, showError } from '../utils/notifications'
import { logger } from '../utils/logger'
import type { Node, Edge } from '@xyflow/react'

jest.mock('../api/client', () => ({
  api: {
    createWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
  },
}))

jest.mock('../utils/notifications', () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}))

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('../utils/workflowFormat', () => ({
  createWorkflowDefinition: jest.fn((params) => ({
    name: params.name,
    description: params.description,
    nodes: params.nodes.map((n: Node) => ({ id: n.id, name: n.data.name })),
    edges: params.edges.map((e: Edge) => ({ id: e.id, source: e.source, target: e.target })),
    variables: params.variables,
  })),
}))

const mockApi = api as jest.Mocked<typeof api>
const mockShowSuccess = showSuccess as jest.MockedFunction<typeof showSuccess>
const mockShowError = showError as jest.MockedFunction<typeof showError>
const mockLoggerError = logger.error as jest.MockedFunction<typeof logger.error>

describe('useWorkflowPersistence', () => {
  let mockSetLocalWorkflowId: jest.Mock
  let mockOnWorkflowSaved: jest.Mock
  let mockSetIsSaving: jest.Mock

  const defaultNodes: Node[] = [
    {
      id: 'node1',
      type: 'agent',
      position: { x: 0, y: 0 },
      data: { name: 'Agent 1' },
    },
  ]

  const defaultEdges: Edge[] = [
    {
      id: 'e1',
      source: 'node1',
      target: 'node2',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetLocalWorkflowId = jest.fn()
    mockOnWorkflowSaved = jest.fn()
    mockSetIsSaving = jest.fn()
  })

  describe('saveWorkflow', () => {
    it('should return null if not authenticated', async () => {
      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: false,
          localWorkflowId: null,
          localWorkflowName: 'Test',
          localWorkflowDescription: '',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      const savedId = await act(async () => {
        return await result.current.saveWorkflow()
      })

      expect(savedId).toBeNull()
      expect(mockShowError).toHaveBeenCalledWith('Please log in to save workflows.')
      expect(mockApi.createWorkflow).not.toHaveBeenCalled()
      expect(mockApi.updateWorkflow).not.toHaveBeenCalled()
    })

    it('should return existing ID if already saving', async () => {
      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: 'existing-id',
          localWorkflowName: 'Test',
          localWorkflowDescription: '',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: true,
          setIsSaving: mockSetIsSaving,
        })
      )

      const savedId = await act(async () => {
        return await result.current.saveWorkflow()
      })

      expect(savedId).toBe('existing-id')
      expect(mockApi.createWorkflow).not.toHaveBeenCalled()
      expect(mockApi.updateWorkflow).not.toHaveBeenCalled()
    })

    it('should create new workflow if no ID exists', async () => {
      const newWorkflow = { id: 'new-id', name: 'Test Workflow' }
      mockApi.createWorkflow.mockResolvedValue(newWorkflow as any)

      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: null,
          localWorkflowName: 'Test Workflow',
          localWorkflowDescription: 'Test Description',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: { var1: 'value1' },
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      await act(async () => {
        await result.current.saveWorkflow()
      })

      expect(mockApi.createWorkflow).toHaveBeenCalled()
      expect(mockSetLocalWorkflowId).toHaveBeenCalledWith('new-id')
      expect(mockShowSuccess).toHaveBeenCalledWith('Workflow created successfully!')
      expect(mockOnWorkflowSaved).toHaveBeenCalledWith('new-id', 'Test Workflow')
      expect(mockSetIsSaving).toHaveBeenCalledWith(false)
    })

    it('should update existing workflow if ID exists', async () => {
      mockApi.updateWorkflow.mockResolvedValue(undefined as any)

      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: 'existing-id',
          localWorkflowName: 'Updated Workflow',
          localWorkflowDescription: 'Updated Description',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      const savedId = await act(async () => {
        return await result.current.saveWorkflow()
      })

      expect(savedId).toBe('existing-id')
      expect(mockApi.updateWorkflow).toHaveBeenCalledWith('existing-id', expect.any(Object))
      expect(mockShowSuccess).toHaveBeenCalledWith('Workflow updated successfully!')
      expect(mockOnWorkflowSaved).toHaveBeenCalledWith('existing-id', 'Updated Workflow')
      expect(mockSetIsSaving).toHaveBeenCalledWith(false)
    })

    it('should handle save errors', async () => {
      const error = new Error('Save failed')
      mockApi.createWorkflow.mockRejectedValue(error)

      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: null,
          localWorkflowName: 'Test',
          localWorkflowDescription: '',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      await act(async () => {
        try {
          await result.current.saveWorkflow()
        } catch (e) {
          // Expected to throw
        }
      })

      expect(mockShowError).toHaveBeenCalledWith('Failed to save workflow: Save failed')
      expect(mockLoggerError).toHaveBeenCalledWith('Failed to save workflow:', error)
      expect(mockSetIsSaving).toHaveBeenCalledWith(false)
    })

    it('should call setIsSaving(true) before saving', async () => {
      mockApi.createWorkflow.mockResolvedValue({ id: 'new-id' } as any)

      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: null,
          localWorkflowName: 'Test',
          localWorkflowDescription: '',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      await act(async () => {
        await result.current.saveWorkflow()
      })

      expect(mockSetIsSaving).toHaveBeenCalledWith(true)
      expect(mockSetIsSaving).toHaveBeenCalledWith(false)
    })
  })

  describe('exportWorkflow', () => {
    let mockAnchor: any

    beforeEach(() => {
      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:url')
      global.URL.revokeObjectURL = jest.fn()
      
      // Mock document.createElement and click
      mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      const originalCreateElement = document.createElement.bind(document)
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockAnchor as any
        }
        return originalCreateElement(tagName)
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should export workflow as JSON file', () => {
      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          localWorkflowName: 'My Workflow',
          localWorkflowDescription: 'Description',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: { var1: 'value1' },
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      act(() => {
        result.current.exportWorkflow()
      })

      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url')
    })

    it('should use workflow name for filename', () => {
      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          localWorkflowName: 'My Test Workflow',
          localWorkflowDescription: '',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      act(() => {
        result.current.exportWorkflow()
      })

      expect(mockAnchor.download).toBe('My-Test-Workflow.json')
    })

    it('should use "workflow" as filename if name is empty', () => {
      const { result } = renderHook(() =>
        useWorkflowPersistence({
          isAuthenticated: true,
          localWorkflowId: 'workflow-id',
          localWorkflowName: '   ',
          localWorkflowDescription: '',
          nodes: defaultNodes,
          edges: defaultEdges,
          variables: {},
          setLocalWorkflowId: mockSetLocalWorkflowId,
          onWorkflowSaved: mockOnWorkflowSaved,
          isSaving: false,
          setIsSaving: mockSetIsSaving,
        })
      )

      act(() => {
        result.current.exportWorkflow()
      })

      expect(mockAnchor.download).toBe('workflow.json')
    })
  })
})
