import { useState, useEffect, useRef } from 'react'
import { Save, Play, FileDown } from 'lucide-react'
import { api } from '../api/client'

interface ToolbarProps {
  workflowId: string | null
  workflowName: string
  workflowDescription: string
  nodes: any[]
  edges: any[]
  variables: Record<string, any>
  onExecutionStart?: (executionId: string) => void
  onWorkflowSaved?: (workflowId: string, name: string) => void
  onWorkflowNameChange: (name: string) => void
  onWorkflowDescriptionChange: (description: string) => void
  onWorkflowIdChange: (id: string) => void
}

export default function Toolbar({ 
  workflowId,
  workflowName,
  workflowDescription,
  nodes,
  edges,
  variables,
  onExecutionStart, 
  onWorkflowSaved,
  onWorkflowNameChange,
  onWorkflowDescriptionChange,
  onWorkflowIdChange
}: ToolbarProps) {

  const [isSaving, setIsSaving] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showInputs, setShowInputs] = useState(false)
  const [executionInputs, setExecutionInputs] = useState<string>('{}')
  
  // Local state for workflow name and description to prevent flickering
  const [localWorkflowName, setLocalWorkflowName] = useState(workflowName)
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState(workflowDescription)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLInputElement>(null)
  
  // Sync local state with props only when workflowId changes (different workflow selected)
  useEffect(() => {
    // Only sync if input is not currently focused (user is not typing)
    if (document.activeElement !== nameInputRef.current) {
      setLocalWorkflowName(workflowName)
    }
    if (document.activeElement !== descriptionInputRef.current) {
      setLocalWorkflowDescription(workflowDescription)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]) // Only depend on workflowId, not the name/description props

  // Helper to convert nodes to workflow format
  const nodeToWorkflowNode = (node: any) => ({
    id: node.id,
    type: node.type,
    name: node.data.name || node.data.label,
    description: node.data.description,
    agent_config: node.data.agent_config,
    condition_config: node.data.condition_config,
    loop_config: node.data.loop_config,
    input_config: node.data.input_config,
    inputs: node.data.inputs || [],
    position: node.position,
  })

  const handleSave = async (): Promise<string | null> => {
    setIsSaving(true)
    try {
      // Build workflow definition using local state (most up-to-date)
      const workflowDef = {
        name: localWorkflowName,
        description: localWorkflowDescription,
        nodes: nodes.map(nodeToWorkflowNode),
        edges: edges,
        variables: variables,
      }
      
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
        onWorkflowIdChange(created.id!)
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
    // Build workflow definition from props
    const workflowDef = {
      name: workflowName,
      description: workflowDescription,
      nodes: nodes.map(nodeToWorkflowNode),
      edges: edges,
      variables: variables,
    }
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
                ref={nameInputRef}
                type="text"
                value={localWorkflowName}
                onChange={(e) => {
                  const newValue = e.target.value
                  setLocalWorkflowName(newValue)
                  onWorkflowNameChange(newValue)
                }}
                className="w-full text-lg font-semibold border-none focus:ring-0 p-0"
                placeholder="Workflow name"
              />
              <input
                ref={descriptionInputRef}
                type="text"
                value={localWorkflowDescription}
                onChange={(e) => {
                  const newValue = e.target.value
                  setLocalWorkflowDescription(newValue)
                  onWorkflowDescriptionChange(newValue)
                }}
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

