/**
 * Settings Tabs Component Tests
 * Tests for settings tabs component rendering and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsTabs } from './SettingsTabs'
import { SETTINGS_TABS } from '../../constants/settingsConstants'

describe('SettingsTabs', () => {
  const mockOnTabChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render both tabs', () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />
    )

    expect(screen.getByText('LLM Providers')).toBeInTheDocument()
    expect(screen.getByText('Workflow Generation')).toBeInTheDocument()
  })

  it('should highlight active tab', () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />
    )

    const llmTab = screen.getByText('LLM Providers').closest('button')
    const workflowTab = screen.getByText('Workflow Generation').closest('button')

    expect(llmTab).toHaveClass('bg-primary-600', 'text-white')
    expect(workflowTab).not.toHaveClass('bg-primary-600', 'text-white')
  })

  it('should call onTabChange when tab is clicked', () => {
    render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />
    )

    const workflowTab = screen.getByText('Workflow Generation')
    fireEvent.click(workflowTab)

    expect(mockOnTabChange).toHaveBeenCalledWith(SETTINGS_TABS.WORKFLOW)
    expect(mockOnTabChange).toHaveBeenCalledTimes(1)
  })

  it('should switch active tab highlight when tab changes', () => {
    const { rerender } = render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />
    )

    let llmTab = screen.getByText('LLM Providers').closest('button')
    let workflowTab = screen.getByText('Workflow Generation').closest('button')

    expect(llmTab).toHaveClass('bg-primary-600', 'text-white')
    expect(workflowTab).not.toHaveClass('bg-primary-600', 'text-white')

    rerender(
      <SettingsTabs
        activeTab={SETTINGS_TABS.WORKFLOW}
        onTabChange={mockOnTabChange}
      />
    )

    llmTab = screen.getByText('LLM Providers').closest('button')
    workflowTab = screen.getByText('Workflow Generation').closest('button')

    expect(workflowTab).toHaveClass('bg-primary-600', 'text-white')
    expect(llmTab).not.toHaveClass('bg-primary-600', 'text-white')
  })

  it('should have correct container structure', () => {
    const { container } = render(
      <SettingsTabs
        activeTab={SETTINGS_TABS.LLM}
        onTabChange={mockOnTabChange}
      />
    )

    const tabsContainer = container.firstChild
    expect(tabsContainer).toHaveClass('flex', 'flex-col', 'gap-2', 'min-w-[170px]')
  })
})
