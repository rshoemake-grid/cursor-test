/**
 * Settings Header Component
 * Extracted from SettingsPage to improve SRP compliance
 * Single Responsibility: Only handles header rendering and navigation
 */

import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export interface SettingsHeaderProps {
  onSyncClick: () => void
}

/**
 * Settings Header Component
 * DRY: Centralized header rendering logic
 */
export function SettingsHeader({ onSyncClick }: SettingsHeaderProps) {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="mb-8">
      <button
        onClick={() => navigate('/')}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Main</span>
      </button>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={onSyncClick}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Sync Now
        </button>
      </div>
      <p className="text-gray-600">Configure LLM providers and workflow generation limits</p>
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          {isAuthenticated
            ? `Signed in as ${user?.username || user?.email || 'your account'}`
            : 'Login to sync your LLM providers across devices.'}
        </p>
      </div>
    </div>
  )
}
