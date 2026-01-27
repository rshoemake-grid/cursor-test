/**
 * TabBar Component
 * Renders the tab bar UI for workflow tabs
 */

import { X, Plus } from 'lucide-react'
import type { WorkflowTabData } from '../contexts/WorkflowTabsContext'

interface TabBarProps {
  tabs: WorkflowTabData[]
  activeTabId: string | null
  editingTabId: string | null
  editingName: string
  editingInputRef: React.RefObject<HTMLInputElement>
  setEditingName: (name: string) => void
  onTabClick: (tabId: string) => void
  onTabDoubleClick: (tab: WorkflowTabData, event: React.MouseEvent) => void
  onCloseTab: (tabId: string, event: React.MouseEvent) => void
  onInputBlur: (tabId: string) => void
  onInputKeyDown: (tabId: string, event: React.KeyboardEvent) => void
  onNewWorkflow: () => void
  onSave: () => void
  onExecute: () => void
  onPublish: () => void
  onExport: () => void
}

export function TabBar({
  tabs,
  activeTabId,
  editingTabId,
  editingName,
  editingInputRef,
  setEditingName,
  onTabClick,
  onTabDoubleClick,
  onCloseTab,
  onInputBlur,
  onInputKeyDown,
  onNewWorkflow,
  onSave,
  onExecute,
  onPublish,
  onExport,
}: TabBarProps) {
  return (
    <div className="flex items-center bg-gray-100 border-b border-gray-300 px-2">
      {/* Workflow Tabs */}
      <div className="flex items-center flex-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            onDoubleClick={(event) => onTabDoubleClick(tab, event)}
            className={`
              flex items-center gap-2 px-4 py-2 border-r border-gray-300 
              transition-colors relative group
              ${tab.id === activeTabId 
                ? 'bg-white text-gray-900 font-medium' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {tab.isUnsaved && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unsaved changes" />
            )}
            <span className="text-sm whitespace-nowrap">
              {editingTabId === tab.id ? (
                <input
                  ref={editingInputRef}
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={() => onInputBlur(tab.id)}
                  onKeyDown={(event) => onInputKeyDown(tab.id, event)}
                  onClick={(event) => event.stopPropagation()}
                  className="w-full text-sm bg-transparent border-b border-blue-400 focus:border-blue-500 focus:outline-none"
                />
              ) : (
                tab.name
              )}
            </span>
            {tabs.length > 1 && (
              <div
                onClick={(e) => onCloseTab(tab.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded p-0.5 transition-opacity cursor-pointer"
                title="Close tab"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onCloseTab(tab.id, e as any)
                  }
                }}
              >
                <X className="w-3 h-3" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          title="Save workflow"
        >
          Save
        </button>
        <button
          onClick={onExecute}
          className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          title="Execute workflow"
        >
          Execute
        </button>
        <button
          onClick={onPublish}
          className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          title="Publish workflow"
        >
          Publish
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          title="Export workflow"
        >
          Export
        </button>
        <button
          onClick={onNewWorkflow}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 transition-colors"
          title="New workflow"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New</span>
        </button>
      </div>
    </div>
  )
}
