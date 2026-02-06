/**
 * Marketplace Tabs Hook Tests
 * Tests for tab management hook to ensure mutation resistance
 */

import { renderHook, act } from '@testing-library/react'
import {
  useMarketplaceTabs,
  MARKETPLACE_TABS,
  REPOSITORY_SUB_TABS,
} from './useMarketplaceTabs'

describe('useMarketplaceTabs', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    expect(result.current.activeTab).toBe(MARKETPLACE_TABS.AGENTS)
    expect(result.current.repositorySubTab).toBe(REPOSITORY_SUB_TABS.WORKFLOWS)
  })

  it('should update activeTab when setActiveTab is called', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    act(() => {
      result.current.setActiveTab(MARKETPLACE_TABS.REPOSITORY)
    })

    expect(result.current.activeTab).toBe(MARKETPLACE_TABS.REPOSITORY)
  })

  it('should update repositorySubTab when setRepositorySubTab is called', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    act(() => {
      result.current.setRepositorySubTab(REPOSITORY_SUB_TABS.AGENTS)
    })

    expect(result.current.repositorySubTab).toBe(REPOSITORY_SUB_TABS.AGENTS)
  })

  it('should correctly identify agents tab', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    expect(result.current.isAgentsTab).toBe(true)
    expect(result.current.isRepositoryTab).toBe(false)
    expect(result.current.isWorkflowsOfWorkflowsTab).toBe(false)
  })

  it('should correctly identify repository tab', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    act(() => {
      result.current.setActiveTab(MARKETPLACE_TABS.REPOSITORY)
    })

    expect(result.current.isAgentsTab).toBe(false)
    expect(result.current.isRepositoryTab).toBe(true)
    expect(result.current.isWorkflowsOfWorkflowsTab).toBe(false)
  })

  it('should correctly identify workflows-of-workflows tab', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    act(() => {
      result.current.setActiveTab(MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS)
    })

    expect(result.current.isAgentsTab).toBe(false)
    expect(result.current.isRepositoryTab).toBe(false)
    expect(result.current.isWorkflowsOfWorkflowsTab).toBe(true)
  })

  it('should correctly identify repository workflows sub-tab', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    act(() => {
      result.current.setActiveTab(MARKETPLACE_TABS.REPOSITORY)
      result.current.setRepositorySubTab(REPOSITORY_SUB_TABS.WORKFLOWS)
    })

    expect(result.current.isRepositoryWorkflowsSubTab).toBe(true)
    expect(result.current.isRepositoryAgentsSubTab).toBe(false)
  })

  it('should correctly identify repository agents sub-tab', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    act(() => {
      result.current.setActiveTab(MARKETPLACE_TABS.REPOSITORY)
      result.current.setRepositorySubTab(REPOSITORY_SUB_TABS.AGENTS)
    })

    expect(result.current.isRepositoryWorkflowsSubTab).toBe(false)
    expect(result.current.isRepositoryAgentsSubTab).toBe(true)
  })

  it('should return false for sub-tabs when not on repository tab', () => {
    const { result } = renderHook(() => useMarketplaceTabs())

    expect(result.current.isRepositoryWorkflowsSubTab).toBe(false)
    expect(result.current.isRepositoryAgentsSubTab).toBe(false)
  })
})

describe('MARKETPLACE_TABS constants', () => {
  it('should have correct values', () => {
    expect(MARKETPLACE_TABS.AGENTS).toBe('agents')
    expect(MARKETPLACE_TABS.REPOSITORY).toBe('repository')
    expect(MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS).toBe('workflows-of-workflows')
  })
})

describe('REPOSITORY_SUB_TABS constants', () => {
  it('should have correct values', () => {
    expect(REPOSITORY_SUB_TABS.WORKFLOWS).toBe('workflows')
    expect(REPOSITORY_SUB_TABS.AGENTS).toBe('agents')
  })
})
