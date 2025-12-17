import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import WorkflowTabs from './components/WorkflowTabs'
import WorkflowList from './components/WorkflowList'
import ExecutionViewer from './components/ExecutionViewer'
import AuthPage from './pages/AuthPage'
import MarketplacePage from './pages/MarketplacePage'
import SettingsPage from './pages/SettingsPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Play, List, Eye, Store, User, LogOut, LogIn, Settings } from 'lucide-react'

type View = 'builder' | 'list' | 'execution'

// Module-level counter that persists across component remounts
let globalWorkflowLoadKey = 0

function MainApp() {
  const [currentView, setCurrentView] = useState<View>('builder')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [workflowLoadKey, setWorkflowLoadKey] = useState<number>(0) // Counter to force new tab creation
  const [executionId, setExecutionId] = useState<string | null>(null)
  
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const processedWorkflowFromUrl = useRef<string | null>(null)

  // Load workflow from URL query parameter (from marketplace)
  useEffect(() => {
    const workflowId = searchParams.get('workflow')
    if (workflowId && workflowId !== processedWorkflowFromUrl.current) {
      console.log(`[App] Loading workflow ${workflowId} from URL`)
      processedWorkflowFromUrl.current = workflowId
      
      // Increment module-level counter (persists across remounts)
      globalWorkflowLoadKey += 1
      const newKey = globalWorkflowLoadKey
      console.log(`[App] Incrementing workflowLoadKey: ${newKey - 1} → ${newKey} (global: ${globalWorkflowLoadKey})`)
      
      setSelectedWorkflowId(workflowId)
      setWorkflowLoadKey(newKey) // Update state to trigger WorkflowTabs effect
      setCurrentView('builder')
      
      // Clear the query parameter after loading
      navigate('/', { replace: true })
      
      // Reset processed ref after a delay to allow same workflow to be opened again
      setTimeout(() => {
        processedWorkflowFromUrl.current = null
      }, 500)
    }
  }, [searchParams, navigate])

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
              <p className="text-sm text-gray-600">Phase 4: Collaboration & Marketplace</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center gap-2">
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
            <Link
              to="/marketplace"
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Store className="w-4 h-4" />
              Marketplace
            </Link>
            <Link
              to="/settings"
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            <div className="ml-4 pl-4 border-l border-gray-300 flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentView === 'builder' && (
          <WorkflowTabs
            initialWorkflowId={selectedWorkflowId}
            workflowLoadKey={workflowLoadKey}
            onExecutionStart={(execId) => {
              // Keep user on builder view - execution console is at bottom
              setExecutionId(execId)
              // Don't change view - user stays on builder
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

