import { useState, useEffect, useRef } from 'react'
import { Save, Play, FileDown } from 'lucide-react'
import { api } from '../api/client'
import { showSuccess, showError } from '../utils/notifications'
import { showConfirm } from '../utils/confirm'
import { useAuth } from '../contexts/AuthContext'

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

  const { isAuthenticated } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showInputs, setShowInputs] = useState(false)
  const [executionInputs, setExecutionInputs] = useState<string>('{}')
  
  // Local state for workflow name and description to prevent flickering
  const [localWorkflowName, setLocalWorkflowName] = useState(workflowName)
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState(workflowDescription)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLInputElement>(null)
  
  // Sync local state with props when workflowId or workflowName/Description changes
  useEffect(() => {
    // Only sync if input is not currently focused (user is not typing)
    if (document.activeElement !== nameInputRef.current) {
      setLocalWorkflowName(workflowName)
    }
    if (document.activeElement !== descriptionInputRef.current) {
      setLocalWorkflowDescription(workflowDescription)
    }
  }, [workflowId, workflowName, workflowDescription]) // Sync when workflow changes or name/description updates

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
    if (!isAuthenticated) {
      showError('Please log in to save workflows.')
      return null
    }
    
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
        showSuccess('Workflow updated successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(workflowId, workflowDef.name)
        }
        return workflowId
      } else {
        // Create new
        const created = await api.createWorkflow(workflowDef)
        onWorkflowIdChange(created.id!)
        showSuccess('Workflow created successfully!')
        if (onWorkflowSaved) {
          onWorkflowSaved(created.id!, workflowDef.name)
        }
        return created.id!
      }
    } catch (error: any) {
      showError('Failed to save workflow: ' + error.message)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const handleExecute = async () => {
    if (!isAuthenticated) {
      showError('Please log in to execute workflows.')
      return
    }
    
    let currentWorkflowId = workflowId
    
    if (!currentWorkflowId) {
      // Auto-save if not saved yet
      const confirmed = await showConfirm(
        'Workflow needs to be saved before execution. Save now?',
        { title: 'Save Workflow', confirmText: 'Save', cancelText: 'Cancel' }
      )
      if (confirmed) {
        currentWorkflowId = await handleSave()
        if (!currentWorkflowId) {
          showError('Failed to save workflow. Cannot execute.')
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
    
    // Use setTimeout to ensure UI updates happen immediately and execution runs in background
    setTimeout(async () => {
      try {
        const inputs = JSON.parse(executionInputs)
        console.log('Executing workflow:', workflowId, 'with inputs:', inputs)
        
        // Update UI immediately without waiting for API response
        setShowInputs(false)
        setExecutionInputs('{}') // Reset inputs
        setIsExecuting(false)
        
        // Generate temporary execution ID for immediate UI feedback
        const tempExecutionId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Create execution entry immediately (optimistic update)
        if (onExecutionStart) {
          onExecutionStart(tempExecutionId)
        }
        
        // Show notification immediately
        showSuccess('✅ Execution starting...\n\nCheck the console at the bottom of the screen to watch it run.', 6000)
        
        // Start execution API call - fire and forget
        api.executeWorkflow(workflowId!, inputs)
          .then((execution) => {
            console.log('Execution started:', execution)
            
            // Update execution ID from temp to real
            if (onExecutionStart && execution.execution_id && execution.execution_id !== tempExecutionId) {
              // Call again with real execution ID - this will update the execution
              onExecutionStart(execution.execution_id)
            }
          })
          .catch((error: any) => {
            console.error('Execution failed:', error)
            setIsExecuting(false)
            showError(`Failed to execute workflow: ${error.response?.data?.detail || error.message || 'Unknown error'}`)
            
            // Remove the temp execution if it exists
            // The execution console will handle cleanup
          })
      } catch (error: any) {
        console.error('Execution setup failed:', error)
        setIsExecuting(false)
        
        // Show non-blocking error notification
        const errorNotification = document.createElement('div')
        errorNotification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 10000;
          max-width: 400px;
          font-family: system-ui, -apple-system, sans-serif;
        `
        errorNotification.textContent = `Failed to execute workflow: ${error.message}`
        document.body.appendChild(errorNotification)
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          errorNotification.style.transition = 'opacity 0.3s'
          errorNotification.style.opacity = '0'
          setTimeout(() => errorNotification.remove(), 300)
        }, 5000)
      }
    }, 0) // Use setTimeout with 0ms to defer to next event loop tick
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
                disabled={isSaving || !isAuthenticated}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                title={!isAuthenticated ? 'Please log in to save workflows' : ''}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : workflowId ? 'Update' : 'Save'}
              </button>

              <button
                onClick={handleExecute}
                disabled={!workflowId || !isAuthenticated}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                title={!isAuthenticated ? 'Please log in to execute workflows' : !workflowId ? 'Save workflow before executing' : 'Execute workflow'}
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
                disabled={isExecuting || !isAuthenticated}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                title={!isAuthenticated ? 'Please log in to execute workflows' : ''}
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

