import { useState } from 'react'
import WorkflowBuilder from './components/WorkflowBuilder'
import WorkflowList from './components/WorkflowList'
import ExecutionViewer from './components/ExecutionViewer'
import { Play, List, Eye } from 'lucide-react'

type View = 'builder' | 'list' | 'execution'

function App() {
  const [currentView, setCurrentView] = useState<View>('builder')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [executionId, setExecutionId] = useState<string | null>(null)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Agentic Workflow Builder
              </h1>
              <p className="text-sm text-gray-600">Phase 2: Visual Editor + Advanced Control Flow</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentView('builder')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentView === 'builder'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Play className="w-4 h-4" />
              Builder
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentView === 'list'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              Workflows
            </button>
            {executionId && (
              <button
                onClick={() => setCurrentView('execution')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'execution'
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                Execution
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'builder' && (
          <WorkflowBuilder
            workflowId={selectedWorkflowId}
            onExecutionStart={(execId) => {
              setExecutionId(execId)
              setCurrentView('execution')
            }}
          />
        )}
        {currentView === 'list' && (
          <WorkflowList
            onSelectWorkflow={(id) => {
              setSelectedWorkflowId(id)
              setCurrentView('builder')
            }}
          />
        )}
        {currentView === 'execution' && executionId && (
          <ExecutionViewer executionId={executionId} />
        )}
      </main>
    </div>
  )
}

export default App

