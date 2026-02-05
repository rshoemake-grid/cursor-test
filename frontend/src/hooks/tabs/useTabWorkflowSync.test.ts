/**
 * Tests for useTabWorkflowSync Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useTabWorkflowSync } from './useTabWorkflowSync'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

describe('useTabWorkflowSync', () => {
  let mockSetTabs: jest.Mock

  const initialTabs: WorkflowTabData[] = [
    {
      id: 'tab-1',
      name: 'Workflow 1',
      workflowId: 'workflow-1',
      isUnsaved: false,
      executions: [],
      activeExecutionId: null,
    },
    {
      id: 'tab-2',
      name: 'Untitled Workflow',
      workflowId: null,
      isUnsaved: true,
      executions: [],
      activeExecutionId: null,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockSetTabs = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        return updater(initialTabs)
      }
      return updater
    })
  })

  describe('handleLoadWorkflow', () => {
    it('should update tab when workflow is loaded', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleLoadWorkflow('tab-2', 'workflow-123', 'Loaded Workflow')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[1]).toMatchObject({
        id: 'tab-2',
        workflowId: 'workflow-123',
        name: 'Loaded Workflow',
        isUnsaved: false,
      })
    })

    it('should not modify other tabs', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleLoadWorkflow('tab-2', 'workflow-123', 'Loaded Workflow')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[0]).toEqual(initialTabs[0])
    })

    it('should mark workflow as saved (isUnsaved: false)', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleLoadWorkflow('tab-2', 'workflow-123', 'Loaded Workflow')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[1].isUnsaved).toBe(false)
    })
  })

  describe('handleWorkflowSaved', () => {
    it('should update tab when workflow is saved', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowSaved('tab-2', 'workflow-123', 'Saved Workflow')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[1]).toMatchObject({
        id: 'tab-2',
        workflowId: 'workflow-123',
        name: 'Saved Workflow',
        isUnsaved: false,
      })
    })

    it('should mark workflow as saved', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowSaved('tab-2', 'workflow-123', 'Saved Workflow')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[1].isUnsaved).toBe(false)
    })

    it('should update existing workflow ID', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowSaved('tab-1', 'workflow-999', 'Updated Name')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[0].workflowId).toBe('workflow-999')
      expect(updatedTabs[0].name).toBe('Updated Name')
    })
  })

  describe('handleWorkflowModified', () => {
    it('should mark tab as unsaved', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-1')
      })

      expect(mockSetTabs).toHaveBeenCalled()
      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[0].isUnsaved).toBe(true)
    })

    it('should not modify other tab properties', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-1')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[0].id).toBe('tab-1')
      expect(updatedTabs[0].name).toBe('Workflow 1')
      expect(updatedTabs[0].workflowId).toBe('workflow-1')
    })

    it('should not modify other tabs', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-1')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[1]).toEqual(initialTabs[1])
    })

    it('should handle already unsaved tab', () => {
      const { result } = renderHook(() =>
        useTabWorkflowSync({
          setTabs: mockSetTabs,
        })
      )

      act(() => {
        result.current.handleWorkflowModified('tab-2')
      })

      const updater = mockSetTabs.mock.calls[0][0]
      const updatedTabs = updater(initialTabs)
      
      expect(updatedTabs[1].isUnsaved).toBe(true)
    })
  })
})
