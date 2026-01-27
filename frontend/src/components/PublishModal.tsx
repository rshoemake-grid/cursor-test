/**
 * PublishModal Component
 * Renders the publish to marketplace modal form
 */

import { X } from 'lucide-react'
import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from '../config/templateConstants'

interface PublishFormData {
  name: string
  description: string
  category: string
  difficulty: string
  estimated_time: string
  tags: string
}

interface PublishModalProps {
  isOpen: boolean
  form: PublishFormData
  isPublishing: boolean
  onClose: () => void
  onFormChange: (field: keyof PublishFormData, value: string) => void
  onSubmit: (e: React.FormEvent) => void | Promise<void>
}

export function PublishModal({
  isOpen,
  form,
  isPublishing,
  onClose,
  onFormChange,
  onSubmit,
}: PublishModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(e)
        }}
        className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Publish to Marketplace</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => onFormChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {TEMPLATE_CATEGORIES.map(category => (
              <option key={category} value={category}>{formatCategory(category)}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => onFormChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {TEMPLATE_DIFFICULTIES.map(diff => (
                <option key={diff} value={diff}>
                  {formatDifficulty(diff)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
            <input
              type="text"
              value={form.estimated_time}
              onChange={(e) => onFormChange('estimated_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. 30 minutes"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => onFormChange('tags', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="automation, ai, ... "
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPublishing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  )
}
