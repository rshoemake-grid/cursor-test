/**
 * Tool Node Editor Component
 * Handles editing of tool node properties
 */

import { NodeWithData } from '../../types/nodeData'

// Built-in tools from backend registry + common ADK tools
export const BUILTIN_TOOLS = [
  { value: 'calculator', label: 'Calculator', description: 'Mathematical calculations' },
  { value: 'web_search', label: 'Web Search', description: 'Search the web' },
  { value: 'python_executor', label: 'Python Executor', description: 'Execute Python code' },
  { value: 'file_reader', label: 'File Reader', description: 'Read file contents' },
  { value: 'google_search', label: 'Google Search (ADK)', description: 'Google ADK search' },
  { value: 'load_web_page', label: 'Load Web Page (ADK)', description: 'Load and parse web pages' },
  { value: 'enterprise_web_search', label: 'Enterprise Web Search (ADK)', description: 'Enterprise search' },
] as const

interface ToolNodeEditorProps {
  node: NodeWithData & { type: 'tool' }
  onUpdate: (field: string, value: unknown) => void
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
}

export default function ToolNodeEditor({
  node,
  onUpdate,
  onConfigUpdate: _onConfigUpdate,
}: ToolNodeEditorProps) {
  const toolConfig = node.data.tool_config || (node.data as any).tool_config || {}
  const toolName = toolConfig.tool_name || 'calculator'

  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Tool Configuration</h4>

      <div>
        <label htmlFor="tool-type" className="block text-sm font-medium text-gray-700 mb-1">
          Tool Type
        </label>
        <select
          id="tool-type"
          value={toolName}
          onChange={(e) =>
            onUpdate('tool_config', {
              ...toolConfig,
              tool_name: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          aria-label="Select tool type"
        >
          {BUILTIN_TOOLS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {BUILTIN_TOOLS.find((t) => t.value === toolName)?.description || 'Callable tool for agents'}
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4" role="status">
        <p className="text-xs text-amber-900 font-medium mb-1">🔧 Tool Node</p>
        <p className="text-xs text-amber-700">
          This node represents a callable tool. Connect it to agents or use it in workflows.
          Tools can be shared via the marketplace.
        </p>
      </div>
    </div>
  )
}
