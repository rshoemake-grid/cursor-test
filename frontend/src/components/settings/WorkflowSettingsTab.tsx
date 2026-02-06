/**
 * Workflow Settings Tab Component
 * Extracted from SettingsTabContent to improve SRP compliance
 * Single Responsibility: Only handles workflow settings rendering
 */

import React from 'react'
import type { LLMProvider } from '../../hooks/providers'

export interface WorkflowSettingsTabProps {
  iterationLimit: number
  onIterationLimitChange: (limit: number) => void
  defaultModel: string
  onDefaultModelChange: (model: string) => void
  providers: LLMProvider[]
}

/**
 * Workflow Settings Tab Component
 * DRY: Centralized workflow settings rendering
 */
export function WorkflowSettingsTab({
  iterationLimit,
  onIterationLimitChange,
  defaultModel,
  onDefaultModelChange,
  providers,
}: WorkflowSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
        <label htmlFor="iteration-limit" className="text-sm font-medium text-gray-700">Iteration limit</label>
        <input
          id="iteration-limit"
          type="number"
          min={1}
          value={iterationLimit}
          onChange={(e) => onIterationLimitChange(Math.max(1, Number(e.target.value) || 1))}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500">
          Number of tool-LLM cycles allowed when using "Chat with LLM".
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3">
        <label htmlFor="default-model" className="text-sm font-medium text-gray-700">Default Model</label>
        <select
          id="default-model"
          value={defaultModel}
          onChange={(e) => onDefaultModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select a model...</option>
          {providers
            .filter(p => p.enabled && p.models && p.models.length > 0)
            .flatMap(provider => 
              (provider.models || []).map(model => ({
                value: model,
                label: `${model} (${provider.name})`
              }))
            )
            .map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
        <p className="text-xs text-gray-500">
          Select the default model to use for workflow generation. Only models from enabled providers are shown.
        </p>
        {defaultModel && (
          <p className="text-xs text-green-600">
            ✓ Using: {defaultModel}
          </p>
        )}
      </div>
    </div>
  )
}
