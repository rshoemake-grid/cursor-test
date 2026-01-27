import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import WorkflowTabs from './components/WorkflowTabs'
import WorkflowList from './components/WorkflowList'
import ExecutionViewer from './components/ExecutionViewer'
import AuthPage from './pages/AuthPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import MarketplacePage from './pages/MarketplacePage'
import SettingsPage from './pages/SettingsPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkflowTabsProvider } from './contexts/WorkflowTabsContext'
import { Play, List, Eye, Store, User, LogOut, LogIn, Settings } from 'lucide-react'
import { showConfirm } from './utils/confirm'
import { logger } from './utils/logger'

type View = 'builder' | 'list' | 'execution'

// Module-level counter that persists across component remounts
let globalWorkflowLoadKey = 0

function AuthenticatedLayout() {
  const [currentView, setCurrentView] = useState<View>('builder')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)
  const [workflowLoadKey, setWorkflowLoadKey] = useState<number>(0)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const [isLogoutPending, setIsLogoutPending] = useState(false)

  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const processedWorkflowFromUrl = useRef<string | null>(null)

  useEffect(() => {
    const workflowId = searchParams.get('workflow')
    if (workflowId && workflowId !== processedWorkflowFromUrl.current) {
      logger.debug(`[App] Loading workflow ${workflowId} from URL`)
      processedWorkflowFromUrl.current = workflowId

      globalWorkflowLoadKey += 1
      const newKey = globalWorkflowLoadKey
      logger.debug(`[App] Incrementing workflowLoadKey: ${newKey - 1} → ${newKey} (global: ${globalWorkflowLoadKey})`)

      setSelectedWorkflowId(workflowId)
      setWorkflowLoadKey(newKey)
      setCurrentView('builder')

      navigate('/', { replace: true })

      setTimeout(() => {
        processedWorkflowFromUrl.current = null
      }, 500)
    }
  }, [searchParams, navigate])

  const goToBuilder = () => {
    setCurrentView('builder')
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const goToList = () => {
    setCurrentView('list')
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const goToExecution = () => {
    setCurrentView('execution')
    if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const renderBuilderContent = () => (
    <WorkflowTabsProvider>
      {currentView === 'builder' && (
        <WorkflowTabs
          initialWorkflowId={selectedWorkflowId}
          workflowLoadKey={workflowLoadKey}
          onExecutionStart={(execId) => {
            setExecutionId(execId)
          }}
        />
      )}
      {currentView === 'list' && (
        <WorkflowList
          onSelectWorkflow={(id) => {
            setSelectedWorkflowId(id)
            setCurrentView('builder')
          }}
          onBack={() => setCurrentView('builder')}
        />
      )}
      {currentView === 'execution' && executionId && (
        <ExecutionViewer executionId={executionId} />
      )}
    </WorkflowTabsProvider>
  )

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
          <nav className="flex items-center gap-2">
            <button
              onClick={goToBuilder}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentView === 'builder' && location.pathname === '/'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Play className="w-4 h-4" />
              Builder
            </button>
            <button
              onClick={goToList}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                currentView === 'list' && location.pathname === '/'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              Workflows
            </button>
            {executionId && (
              <button
                onClick={goToExecution}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentView === 'execution' && location.pathname === '/'
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
                    onClick={async () => {
                      if (isLogoutPending) return
                      setIsLogoutPending(true)
                      const confirmed = await showConfirm(
                        'Do you really want to log out? Any unsaved workflows will remain in draft but may be lost if you close the tab.',
                        { title: 'Confirm Logout', confirmText: 'Log out', cancelText: 'Cancel', type: 'danger' }
                      )
                      setIsLogoutPending(false)
                      if (confirmed) {
                        logout()
                      }
                    }}
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

      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route
            index
            element={renderBuilderContent()}
          />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={<AuthenticatedLayout />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

