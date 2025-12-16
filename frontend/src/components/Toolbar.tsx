import { useState } from 'react'
import { Save, Play, FileDown } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'
import { api } from '../api/client'

interface ToolbarProps {
  onExecutionStart?: (executionId: string) => void
  onWorkflowSaved?: (workflowId: string, name: string) => void
}

export default function Toolbar({ onExecutionStart, onWorkflowSaved }: ToolbarProps) {
  const {
    workflowId,
    workflowName,
    workflowDescription,
    setWorkflowName,
    setWorkflowDescription,
    setWorkflowId,
    toWorkflowDefinition,
    clearWorkflow,
  } = useWorkflowStore()

  const [isSaving, setIsSaving] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showInputs, setShowInputs] = useState(false)
  const [executionInputs, setExecutionInputs] = useState<string>('{}')

  const handleSave = async (): Promise<string | null> => {
    setIsSaving(true)
    try {
      const workflowDef = toWorkflowDefinition()
      
      if (workflowId) {
        // Update existing
        await api.updateWorkflow(workflowId, workflowDef)
        alert('Workflow updated successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(workflowId, workflowDef.name)
        }
        return workflowId
      } else {
        // Create new
        const created = await api.createWorkflow(workflowDef)
        setWorkflowId(created.id!)
        alert('Workflow created successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(created.id!, workflowDef.name)
        }
        return created.id!
      }
    } catch (error: any) {
      alert('Failed to save workflow: ' + error.message)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handleExecute = async () => {
    let currentWorkflowId = workflowId
    
    if (!currentWorkflowId) {
      // Auto-save if not saved yet
      const confirm = window.confirm('Workflow needs to be saved before execution. Save now?')
      if (confirm) {
        currentWorkflowId = await handleSave()
        if (!currentWorkflowId) {
          alert('Failed to save workflow. Cannot execute.')
          return
        }
      } else {
        return
      }
    }

    setShowInputs(true)
  }

  const handleConfirmExecute = async () => {
    setIsExecuting(true)
    try {
      const inputs = JSON.parse(executionInputs)
      console.log('Executing workflow:', workflowId, 'with inputs:', inputs)
      
      const execution = await api.executeWorkflow(workflowId!, inputs)
      console.log('Execution started:', execution)
      
      setShowInputs(false)
      setExecutionInputs('{}') // Reset inputs
      
      if (onExecutionStart) {
        onExecutionStart(execution.execution_id)
      }
      
      // Show success message
      const message = `✅ Execution started!\n\nExecution ID: ${execution.execution_id.slice(0, 8)}...\n\nCheck the console at the bottom of the screen to watch it run.`
      alert(message)
    } catch (error: any) {
      console.error('Execution failed:', error)
      alert('Failed to execute workflow: ' + error.message)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExport = () => {
    const workflowDef = toWorkflowDefinition()
    const blob = new Blob([JSON.stringify(workflowDef, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-4">
        <div className="flex-1 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full text-lg font-semibold border-none focus:ring-0 p-0"
                placeholder="Workflow name"
              />
              <input
                type="text"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="w-full text-sm text-gray-600 border-none focus:ring-0 p-0 mt-1"
                placeholder="Description (optional)"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : workflowId ? 'Update' : 'Save'}
              </button>

              <button
                onClick={handleExecute}
                disabled={!workflowId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Execute
              </button>

              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
                title="Export workflow"
              >
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Inputs Modal */}
      {showInputs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-semibold mb-4">Workflow Inputs</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide input variables as JSON (e.g., {`{"topic": "AI"}`})
            </p>
            <textarea
              value={executionInputs}
              onChange={(e) => setExecutionInputs(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm"
              placeholder='{"key": "value"}'
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowInputs(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExecute}
                disabled={isExecuting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

