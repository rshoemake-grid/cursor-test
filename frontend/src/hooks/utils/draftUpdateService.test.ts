/**
 * Draft Update Service Tests
 * Tests for draft update service to ensure mutation resistance
 */

import { updateDraftStorage, resetFlagAfterDelay, type DraftData } from './draftUpdateService'
import { DRAFT_UPDATE } from './marketplaceConstants'

describe('draftUpdateService', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('updateDraftStorage', () => {
    it('should update draft storage with new nodes', () => {
      const tabDraftsRef = { current: {} } as React.MutableRefObject<Record<string, any>>
      const tabId = 'tab-1'
      const updatedNodes = [{ id: 'node-1' }, { id: 'node-2' }]
      const workflowId = 'workflow-1'
      const workflowName = 'Test Workflow'
      const workflowDescription = 'Test Description'
      const tabIsUnsaved = true
      const saveDraftsToStorage = jest.fn()
      const logger = { debug: jest.fn() }

      updateDraftStorage(
        tabDraftsRef,
        tabId,
        updatedNodes,
        workflowId,
        workflowName,
        workflowDescription,
        tabIsUnsaved,
        saveDraftsToStorage,
        logger
      )

      // Should not update immediately
      expect(tabDraftsRef.current[tabId]).toBeUndefined()

      // Fast-forward time
      jest.advanceTimersByTime(DRAFT_UPDATE.IMMEDIATE_DELAY)

      // Should update after delay
      const draft = tabDraftsRef.current[tabId] as DraftData
      expect(draft.nodes).toEqual(updatedNodes)
      expect(draft.workflowId).toBe(workflowId)
      expect(draft.workflowName).toBe(workflowName)
      expect(draft.workflowDescription).toBe(workflowDescription)
      expect(draft.isUnsaved).toBe(tabIsUnsaved)
      expect(saveDraftsToStorage).toHaveBeenCalledWith(tabDraftsRef.current)
      expect(logger.debug).toHaveBeenCalledWith('[DraftUpdate] Draft updated with new nodes, total:', 2)
    })

    it('should preserve existing edges when updating', () => {
      const existingEdges = [{ id: 'edge-1' }]
      const tabDraftsRef = {
        current: {
          'tab-1': {
            nodes: [],
            edges: existingEdges,
            workflowId: null,
            workflowName: '',
            workflowDescription: '',
            isUnsaved: false
          }
        }
      } as React.MutableRefObject<Record<string, any>>
      const tabId = 'tab-1'
      const updatedNodes = [{ id: 'node-1' }]
      const saveDraftsToStorage = jest.fn()
      const logger = { debug: jest.fn() }

      updateDraftStorage(
        tabDraftsRef,
        tabId,
        updatedNodes,
        null,
        '',
        '',
        false,
        saveDraftsToStorage,
        logger
      )

      jest.advanceTimersByTime(DRAFT_UPDATE.IMMEDIATE_DELAY)

      const draft = tabDraftsRef.current[tabId] as DraftData
      expect(draft.edges).toEqual(existingEdges)
    })

    it('should use empty array for edges when no existing draft', () => {
      const tabDraftsRef = { current: {} } as React.MutableRefObject<Record<string, any>>
      const tabId = 'tab-1'
      const updatedNodes = [{ id: 'node-1' }]
      const saveDraftsToStorage = jest.fn()
      const logger = { debug: jest.fn() }

      updateDraftStorage(
        tabDraftsRef,
        tabId,
        updatedNodes,
        null,
        '',
        '',
        false,
        saveDraftsToStorage,
        logger
      )

      jest.advanceTimersByTime(DRAFT_UPDATE.IMMEDIATE_DELAY)

      const draft = tabDraftsRef.current[tabId] as DraftData
      expect(draft.edges).toEqual([])
    })

    it('should handle null workflowId', () => {
      const tabDraftsRef = { current: {} } as React.MutableRefObject<Record<string, any>>
      const tabId = 'tab-1'
      const updatedNodes = []
      const saveDraftsToStorage = jest.fn()
      const logger = { debug: jest.fn() }

      updateDraftStorage(
        tabDraftsRef,
        tabId,
        updatedNodes,
        null,
        '',
        '',
        false,
        saveDraftsToStorage,
        logger
      )

      jest.advanceTimersByTime(DRAFT_UPDATE.IMMEDIATE_DELAY)

      const draft = tabDraftsRef.current[tabId] as DraftData
      expect(draft.workflowId).toBeNull()
    })
  })

  describe('resetFlagAfterDelay', () => {
    it('should reset flag after delay', () => {
      const flagRef = { current: true } as React.MutableRefObject<boolean>
      const logger = { debug: jest.fn() }

      resetFlagAfterDelay(flagRef, logger)

      // Should not reset immediately
      expect(flagRef.current).toBe(true)

      // Fast-forward time
      jest.advanceTimersByTime(DRAFT_UPDATE.FLAG_RESET_DELAY)

      // Should reset after delay
      expect(flagRef.current).toBe(false)
      expect(logger.debug).toHaveBeenCalledWith('[DraftUpdate] Reset flag')
    })

    it('should reset flag even if already false', () => {
      const flagRef = { current: false } as React.MutableRefObject<boolean>
      const logger = { debug: jest.fn() }

      resetFlagAfterDelay(flagRef, logger)

      jest.advanceTimersByTime(DRAFT_UPDATE.FLAG_RESET_DELAY)

      expect(flagRef.current).toBe(false)
      expect(logger.debug).toHaveBeenCalledWith('[DraftUpdate] Reset flag')
    })
  })
})
