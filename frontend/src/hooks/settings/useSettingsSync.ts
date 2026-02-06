/**
 * Settings Sync Hook
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles settings synchronization (auto-save and manual sync)
 */

import { useMemo, useCallback } from 'react'
import { showError, showSuccess } from '../../utils/notifications'
import type { SettingsService } from '../../services/SettingsService'
import type { LLMProvider } from '../providers'
import { useAutoSave } from '../storage'

export interface UseSettingsSyncOptions {
  isAuthenticated: boolean
  token: string | null
  providers: LLMProvider[]
  iterationLimit: number
  defaultModel: string
  settingsService: SettingsService
  settingsLoaded: boolean
  consoleAdapter: {
    log: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
  }
}

export interface UseSettingsSyncReturn {
  handleManualSync: () => Promise<void>
}

/**
 * Hook for settings synchronization
 * DRY: Centralized sync logic for auto-save and manual sync
 */
export function useSettingsSync(options: UseSettingsSyncOptions): UseSettingsSyncReturn {
  const {
    isAuthenticated,
    token,
    providers,
    iterationLimit,
    defaultModel,
    settingsService,
    settingsLoaded,
    consoleAdapter,
  } = options

  /**
   * Auto-save settings when they change (after initial load)
   * DRY: Reusable auto-save logic
   */
  const autoSaveSettings = useMemo(() => async () => {
    if (!isAuthenticated || !token || !settingsLoaded) return
    try {
      await settingsService.saveSettings({
        providers,
        iteration_limit: iterationLimit,
        default_model: defaultModel,
      }, token)
      consoleAdapter.log('Settings auto-saved to backend')
    } catch (error) {
      consoleAdapter.error('Failed to auto-save settings:', error)
    }
  }, [settingsService, providers, iterationLimit, defaultModel, isAuthenticated, token, settingsLoaded, consoleAdapter])

  // Enable auto-save
  useAutoSave(
    { providers, iterationLimit, defaultModel },
    autoSaveSettings,
    500,
    !!(isAuthenticated && token && settingsLoaded)
  )

  /**
   * Manual sync handler
   * DRY: Extracted from component
   */
  const handleManualSync = useCallback(async () => {
    if (!isAuthenticated) {
      showError('Sign in to sync your LLM settings with the server.')
      return
    }

    try {
      await settingsService.saveSettings({
        providers,
        iteration_limit: iterationLimit,
        default_model: defaultModel,
      }, token!)
      showSuccess('Settings synced to backend successfully!')
    } catch (error) {
      showError('Error syncing settings: ' + error)
    }
  }, [isAuthenticated, token, providers, iterationLimit, defaultModel, settingsService])

  return {
    handleManualSync,
  }
}
