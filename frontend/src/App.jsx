import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import WorkflowTabs from './components/WorkflowTabs';
import WorkflowList from './components/WorkflowList';
import ExecutionViewer from './components/ExecutionViewer';
import ErrorBoundary from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MarketplacePage from './pages/MarketplacePage';
import SettingsPage from './pages/SettingsPage';
import LogPage from './pages/LogPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowTabsProvider } from './contexts/WorkflowTabsContext';
import { Play, List, Eye, Store, User, LogOut, LogIn, Settings, FileText, BarChart3 } from 'lucide-react';
import { showConfirm } from './utils/confirm';
import { logger } from './utils/logger';
function AuthenticatedLayout() {
    const [currentView, setCurrentView] = useState('builder');
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
    const [workflowLoadKey, setWorkflowLoadKey] = useState(0);
    const [executionId, setExecutionId] = useState(null);
    const [isLogoutPending, setIsLogoutPending] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const processedWorkflowFromUrl = useRef(null);
    const workflowLoadKeyRef = useRef(0);
    useEffect(()=>{
        const workflowId = searchParams.get('workflow');
        const executionIdParam = searchParams.get('execution');
        if (workflowId && workflowId !== processedWorkflowFromUrl.current) {
            logger.debug(`[App] Loading workflow ${workflowId} from URL`);
            processedWorkflowFromUrl.current = workflowId;
            workflowLoadKeyRef.current += 1;
            const newKey = workflowLoadKeyRef.current;
            logger.debug(`[App] Incrementing workflowLoadKey: ${newKey - 1} → ${newKey}`);
            setSelectedWorkflowId(workflowId);
            setWorkflowLoadKey(newKey);
            setCurrentView('builder');
            navigate('/', {
                replace: true
            });
            const timeoutId = setTimeout(()=>{
                processedWorkflowFromUrl.current = null;
            }, 500);
            return ()=>clearTimeout(timeoutId);
        }
        if (executionIdParam && executionIdParam !== executionId) {
            logger.debug(`[App] Loading execution ${executionIdParam} from URL`);
            setExecutionId(executionIdParam);
            setCurrentView('execution');
            navigate('/', {
                replace: true
            });
        }
    }, [
        searchParams,
        navigate,
        location,
        executionId
    ]);
    const goToBuilder = useCallback(()=>{
        setCurrentView('builder');
        if (location.pathname !== '/') {
            navigate('/');
        }
    }, [
        location.pathname,
        navigate
    ]);
    const goToList = useCallback(()=>{
        setCurrentView('list');
        if (location.pathname !== '/') {
            navigate('/');
        }
    }, [
        location.pathname,
        navigate
    ]);
    const goToExecution = useCallback(()=>{
        setCurrentView('execution');
        if (location.pathname !== '/') {
            navigate('/');
        }
    }, [
        location.pathname,
        navigate
    ]);
    const handleExecutionStart = useCallback((execId)=>{
        setExecutionId(execId);
    }, []);
    const handleSelectWorkflow = useCallback((id)=>{
        setSelectedWorkflowId(id);
        setCurrentView('builder');
    }, []);
    const handleBackToList = useCallback(()=>{
        setCurrentView('builder');
    }, []);
    const renderBuilderContent = ()=>/*#__PURE__*/ _jsxs(WorkflowTabsProvider, {
            children: [
                currentView === 'builder' && /*#__PURE__*/ _jsx(WorkflowTabs, {
                    initialWorkflowId: selectedWorkflowId,
                    workflowLoadKey: workflowLoadKey,
                    onExecutionStart: handleExecutionStart
                }),
                currentView === 'list' && /*#__PURE__*/ _jsx(WorkflowList, {
                    onSelectWorkflow: handleSelectWorkflow,
                    onBack: handleBackToList
                }),
                currentView === 'execution' && executionId && /*#__PURE__*/ _jsx(ExecutionViewer, {
                    executionId: executionId
                })
            ]
        });
    return /*#__PURE__*/ _jsxs("div", {
        className: "flex flex-col h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ _jsx("header", {
                className: "bg-white shadow-sm border-b border-gray-200 px-6 py-4",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ _jsx("div", {
                                    className: "w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center",
                                    children: /*#__PURE__*/ _jsx(Play, {
                                        className: "w-6 h-6 text-white"
                                    })
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("h1", {
                                            className: "text-2xl font-bold text-gray-900",
                                            children: "Agentic Workflow Builder"
                                        }),
                                        /*#__PURE__*/ _jsx("p", {
                                            className: "text-sm text-gray-600",
                                            children: "Phase 4: Collaboration & Marketplace"
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("nav", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ _jsxs("button", {
                                    onClick: goToBuilder,
                                    className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentView === 'builder' && location.pathname === '/' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(Play, {
                                            className: "w-4 h-4"
                                        }),
                                        "Builder"
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("button", {
                                    onClick: goToList,
                                    className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentView === 'list' && location.pathname === '/' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(List, {
                                            className: "w-4 h-4"
                                        }),
                                        "Workflows"
                                    ]
                                }),
                                executionId && /*#__PURE__*/ _jsxs("button", {
                                    onClick: goToExecution,
                                    className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentView === 'execution' && location.pathname === '/' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(Eye, {
                                            className: "w-4 h-4"
                                        }),
                                        "Execution"
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs(Link, {
                                    to: "/marketplace",
                                    className: "px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100 transition-colors",
                                    children: [
                                        /*#__PURE__*/ _jsx(Store, {
                                            className: "w-4 h-4"
                                        }),
                                        "Marketplace"
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs(Link, {
                                    to: "/log",
                                    className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${location.pathname === '/log' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(FileText, {
                                            className: "w-4 h-4"
                                        }),
                                        "Log"
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs(Link, {
                                    to: "/analytics",
                                    className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${location.pathname === '/analytics' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(BarChart3, {
                                            className: "w-4 h-4"
                                        }),
                                        "Analytics"
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs(Link, {
                                    to: "/settings",
                                    className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${location.pathname === '/settings' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`,
                                    children: [
                                        /*#__PURE__*/ _jsx(Settings, {
                                            className: "w-4 h-4"
                                        }),
                                        "Settings"
                                    ]
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: "ml-4 pl-4 border-l border-gray-300 flex items-center gap-2",
                                    children: isAuthenticated ? /*#__PURE__*/ _jsxs(_Fragment, {
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg",
                                                children: [
                                                    /*#__PURE__*/ _jsx(User, {
                                                        className: "w-4 h-4 text-gray-600"
                                                    }),
                                                    /*#__PURE__*/ _jsx("span", {
                                                        className: "text-sm font-medium text-gray-700",
                                                        children: user?.username
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsx("button", {
                                                onClick: async ()=>{
                                                    if (isLogoutPending) return;
                                                    setIsLogoutPending(true);
                                                    const confirmed = await showConfirm('Do you really want to log out? Any unsaved workflows will remain in draft but may be lost if you close the tab.', {
                                                        title: 'Confirm Logout',
                                                        confirmText: 'Log out',
                                                        cancelText: 'Cancel',
                                                        type: 'danger'
                                                    });
                                                    setIsLogoutPending(false);
                                                    if (confirmed) {
                                                        logout();
                                                    }
                                                },
                                                className: "p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                                                title: "Logout",
                                                children: /*#__PURE__*/ _jsx(LogOut, {
                                                    className: "w-4 h-4"
                                                })
                                            })
                                        ]
                                    }) : /*#__PURE__*/ _jsxs(Link, {
                                        to: "/auth",
                                        className: "px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors",
                                        children: [
                                            /*#__PURE__*/ _jsx(LogIn, {
                                                className: "w-4 h-4"
                                            }),
                                            "Sign In"
                                        ]
                                    })
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx("main", {
                className: "flex-1 overflow-hidden",
                children: /*#__PURE__*/ _jsxs(Routes, {
                    children: [
                        /*#__PURE__*/ _jsx(Route, {
                            index: true,
                            element: renderBuilderContent()
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "marketplace",
                            element: /*#__PURE__*/ _jsx(MarketplacePage, {})
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "log",
                            element: /*#__PURE__*/ _jsx(LogPage, {})
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "analytics",
                            element: /*#__PURE__*/ _jsx(AnalyticsPage, {})
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "settings",
                            element: /*#__PURE__*/ _jsx(SettingsPage, {})
                        })
                    ]
                })
            })
        ]
    });
}
function App() {
    // Global error handler for unhandled promise rejections
    useEffect(()=>{
        const handleUnhandledRejection = (event)=>{
            logger.error('Unhandled promise rejection:', event.reason);
        // Optionally show user notification
        // showError('An unexpected error occurred. Please refresh the page.')
        };
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return ()=>{
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);
    return /*#__PURE__*/ _jsx(ErrorBoundary, {
        onError: (error, errorInfo)=>{
            // Log to error reporting service (e.g., Sentry)
            logger.error('ErrorBoundary caught error:', error, errorInfo);
        },
        children: /*#__PURE__*/ _jsx(Router, {
            children: /*#__PURE__*/ _jsx(AuthProvider, {
                children: /*#__PURE__*/ _jsxs(Routes, {
                    children: [
                        /*#__PURE__*/ _jsx(Route, {
                            path: "/auth",
                            element: /*#__PURE__*/ _jsx(AuthPage, {})
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "/forgot-password",
                            element: /*#__PURE__*/ _jsx(ForgotPasswordPage, {})
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "/reset-password",
                            element: /*#__PURE__*/ _jsx(ResetPasswordPage, {})
                        }),
                        /*#__PURE__*/ _jsx(Route, {
                            path: "/*",
                            element: /*#__PURE__*/ _jsx(AuthenticatedLayout, {})
                        })
                    ]
                })
            })
        })
    });
}
export default App;
