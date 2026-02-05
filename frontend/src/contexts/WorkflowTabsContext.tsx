import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode, useCallback } from 'react'
// Domain-based imports - Phase 7
import { getLocalStorageItem } from '../hooks/storage'
import { showSuccess } from '../utils/notifications'
import type { StorageAdapter } from '../types/adapters'

export interface Execution {
  id: string
  status: string
  startedAt: Date
  completedAt?: Date
  nodes: Record<string, any>
  logs: any[]
}

export interface WorkflowTabData {
  id: string
  name: string
  workflowId: string | null
  isUnsaved: boolean
  executions: Execution[]
  activeExecutionId: string | null
}

const WORKFLOW_TABS_STORAGE_KEY = 'workflowTabs'
const ACTIVE_TAB_STORAGE_KEY = 'activeWorkflowTabId'

const emptyTabState: WorkflowTabData = {
  id: 'workflow-1',
  name: 'Untitled Workflow',
  workflowId: null,
  isUnsaved: true,
  executions: [],
  activeExecutionId: null
}

interface WorkflowTabsContextValue {
  tabs: WorkflowTabData[]
  setTabs: (tabs: WorkflowTabData[] | ((prev: WorkflowTabData[]) => WorkflowTabData[])) => void
  activeTabId: string
  setActiveTabId: (id: string) => void
  processedKeys: React.MutableRefObject<Set<string>>
}

const WorkflowTabsContext = createContext<WorkflowTabsContextValue | null>(null)

interface WorkflowTabsProviderProps {
  children: ReactNode
  storage?: StorageAdapter | null
  initialTabs?: WorkflowTabData[] // For testing
  initialActiveTabId?: string | null // For testing
}

export function WorkflowTabsProvider({ 
  children, 
  storage,
  initialTabs,
  initialActiveTabId
}: WorkflowTabsProviderProps) {
  // Initialize tabs from storage or provided initial value
  const [tabs, setTabsState] = useState<WorkflowTabData[]>(() => {
    if (initialTabs) {
      return initialTabs
    }
    const stored = getLocalStorageItem<WorkflowTabData[]>(WORKFLOW_TABS_STORAGE_KEY, [])
    return Array.isArray(stored) && stored.length > 0 ? stored : [emptyTabState]
  })
  
  // Initialize activeTabId from storage or provided initial value
  const [activeTabId, setActiveTabIdState] = useState<string>(() => {
    if (initialActiveTabId !== undefined) {
      return initialActiveTabId || tabs[0]?.id || 'workflow-1'
    }
    const saved = getLocalStorageItem<string | null>(ACTIVE_TAB_STORAGE_KEY, null)
    return (saved && tabs.some(tab => tab.id === saved)) ? saved : (tabs[0]?.id || 'workflow-1')
  })

  // Track processed workflowId+loadKey combinations (for preventing duplicate tabs)
  const processedKeys = useRef<Set<string>>(new Set())

  // Persist tabs to storage whenever they change
  useEffect(() => {
    if (storage) {
      try {
        storage.setItem(WORKFLOW_TABS_STORAGE_KEY, JSON.stringify(tabs))
      } catch {
        // ignore quota errors
      }
    } else if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(WORKFLOW_TABS_STORAGE_KEY, JSON.stringify(tabs))
      } catch {
        // ignore quota errors
      }
    }
  }, [tabs, storage])

  // Persist activeTabId to storage whenever it changes
  useEffect(() => {
    if (activeTabId) {
      if (storage) {
        try {
          storage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTabId)
        } catch {
          // ignore quota errors
        }
      } else if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTabId)
        } catch {
          // ignore quota errors
        }
      }
    } else {
      if (storage) {
        try {
          storage.removeItem(ACTIVE_TAB_STORAGE_KEY)
        } catch {
          // ignore
        }
      } else if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY)
        } catch {
          // ignore
        }
      }
    }
  }, [activeTabId, storage])

  // Show success message when restoring tabs from storage (only once)
  const [storageToastShown, setStorageToastShown] = useState(false)
  const isInitialStoragePresent = useMemo(() => {
    if (initialTabs) return false
    const stored = getLocalStorageItem<WorkflowTabData[]>(WORKFLOW_TABS_STORAGE_KEY, [])
    return Array.isArray(stored) && stored.length > 0
  }, [initialTabs])

  useEffect(() => {
    if (isInitialStoragePresent && !storageToastShown) {
      showSuccess('Restored open workflow tabs from your previous session.')
      setStorageToastShown(true)
    }
  }, [isInitialStoragePresent, storageToastShown])

  // Wrapper for setTabs that supports both direct value and updater function
  const setTabs = useCallback((updater: WorkflowTabData[] | ((prev: WorkflowTabData[]) => WorkflowTabData[])) => {
    if (typeof updater === 'function') {
      setTabsState(updater)
    } else {
      setTabsState(updater)
    }
  }, [])

  const setActiveTabId = useCallback((id: string) => {
    setActiveTabIdState(id)
  }, [])

  const value: WorkflowTabsContextValue = {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    processedKeys
  }

  return (
    <WorkflowTabsContext.Provider value={value}>
      {children}
    </WorkflowTabsContext.Provider>
  )
}

export function useWorkflowTabs() {
  const context = useContext(WorkflowTabsContext)
  if (!context) {
    throw new Error('useWorkflowTabs must be used within WorkflowTabsProvider')
  }
  return context
}

// Export for testing - allows resetting processedKeys
export function resetWorkflowTabsContext() {
  // This is a no-op in the context, but can be used in tests
  // The actual reset happens when creating a new provider instance
}
