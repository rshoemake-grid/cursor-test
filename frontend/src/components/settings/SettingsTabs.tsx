/**
 * Settings Tabs Component
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles tab navigation
 */

import React from 'react'
import { SettingsTabButton } from './SettingsTabButton'
import { SETTINGS_TABS } from '../../constants/settingsConstants'

export interface SettingsTabsProps {
  activeTab: typeof SETTINGS_TABS.LLM | typeof SETTINGS_TABS.WORKFLOW
  onTabChange: (tab: typeof SETTINGS_TABS.LLM | typeof SETTINGS_TABS.WORKFLOW) => void
}

/**
 * Settings Tabs Component
 * DRY: Centralized tab navigation
 */
export function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[170px]">
      <SettingsTabButton
        label="LLM Providers"
        isActive={activeTab === SETTINGS_TABS.LLM}
        onClick={() => onTabChange(SETTINGS_TABS.LLM)}
      />
      <SettingsTabButton
        label="Workflow Generation"
        isActive={activeTab === SETTINGS_TABS.WORKFLOW}
        onClick={() => onTabChange(SETTINGS_TABS.WORKFLOW)}
      />
    </div>
  )
}
