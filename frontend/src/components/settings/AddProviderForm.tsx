/**
 * Add Provider Form Component
 * Extracted from SettingsTabContent to improve SRP compliance
 * Single Responsibility: Only handles add provider form rendering
 */

import { Plus } from 'lucide-react'
import { PROVIDER_TEMPLATES } from '../../constants/settingsConstants'

export interface AddProviderFormProps {
  showAddProvider: boolean
  onShowAddProvider: (show: boolean) => void
  selectedTemplate: keyof typeof PROVIDER_TEMPLATES
  onSelectedTemplateChange: (template: keyof typeof PROVIDER_TEMPLATES) => void
  onAddProvider: () => void
}

/**
 * Add Provider Form Component
 * DRY: Centralized add provider form rendering
 */
export function AddProviderForm({
  showAddProvider,
  onShowAddProvider,
  selectedTemplate,
  onSelectedTemplateChange,
  onAddProvider,
}: AddProviderFormProps) {
  if (!showAddProvider) {
    return (
      <button
        onClick={() => onShowAddProvider(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add LLM Provider
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Provider</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="provider-type-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Provider Type
          </label>
          <select
            id="provider-type-select"
            value={selectedTemplate}
            onChange={(e) => onSelectedTemplateChange(e.target.value as keyof typeof PROVIDER_TEMPLATES)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="openai">OpenAI (GPT-4, GPT-3.5, etc.)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="gemini">Google Gemini</option>
            <option value="custom">Custom Provider</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAddProvider}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add Provider
          </button>
          <button
            onClick={() => onShowAddProvider(false)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
