import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import WorkflowTabs from "./components/WorkflowTabs";
import WorkflowList from "./components/WorkflowList";
import ExecutionViewer from "./components/ExecutionViewer";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import MarketplacePage from "./pages/MarketplacePage";
import SettingsPage from "./pages/SettingsPage";
import LogPage from "./pages/LogPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WorkflowTabsProvider } from "./contexts/WorkflowTabsContext";
import { queryClient } from "./config/queryClient";
import { Play, List, Eye, Store, User, LogOut, LogIn, Settings, FileText, BarChart3 } from "lucide-react";
import { showConfirm } from "./utils/confirm";
import { logger } from "./utils/logger";
function AuthenticatedLayout() {
  const [currentView, setCurrentView] = useState("builder");
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
  useEffect(() => {
    const workflowId = searchParams.get("workflow");
    const executionIdParam = searchParams.get("execution");
    if (workflowId && workflowId !== processedWorkflowFromUrl.current) {
      logger.debug(`[App] Loading workflow ${workflowId} from URL`);
      processedWorkflowFromUrl.current = workflowId;
      workflowLoadKeyRef.current += 1;
      const newKey = workflowLoadKeyRef.current;
      logger.debug(`[App] Incrementing workflowLoadKey: ${newKey - 1} \u2192 ${newKey}`);
      setSelectedWorkflowId(workflowId);
      setWorkflowLoadKey(newKey);
      setCurrentView("builder");
      navigate("/", { replace: true });
      const timeoutId = setTimeout(() => {
        processedWorkflowFromUrl.current = null;
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    if (executionIdParam && executionIdParam !== executionId) {
      logger.debug(`[App] Loading execution ${executionIdParam} from URL`);
      setExecutionId(executionIdParam);
      setCurrentView("execution");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, location, executionId]);
  const goToBuilder = useCallback(() => {
    setCurrentView("builder");
    if (location.pathname !== "/") {
      navigate("/");
    }
  }, [location.pathname, navigate]);
  const goToList = useCallback(() => {
    setCurrentView("list");
    if (location.pathname !== "/") {
      navigate("/");
    }
  }, [location.pathname, navigate]);
  const goToExecution = useCallback(() => {
    setCurrentView("execution");
    if (location.pathname !== "/") {
      navigate("/");
    }
  }, [location.pathname, navigate]);
  const handleExecutionStart = useCallback((execId) => {
    setExecutionId(execId);
  }, []);
  const handleSelectWorkflow = useCallback((id) => {
    setSelectedWorkflowId(id);
    setCurrentView("builder");
  }, []);
  const handleBackToList = useCallback(() => {
    setCurrentView("builder");
  }, []);
  const renderBuilderContent = () => /* @__PURE__ */ jsxs(WorkflowTabsProvider, { children: [
    currentView === "builder" && /* @__PURE__ */ jsx(
      WorkflowTabs,
      {
        initialWorkflowId: selectedWorkflowId,
        workflowLoadKey,
        onExecutionStart: handleExecutionStart
      }
    ),
    currentView === "list" && /* @__PURE__ */ jsx(
      WorkflowList,
      {
        onSelectWorkflow: handleSelectWorkflow,
        onBack: handleBackToList
      }
    ),
    currentView === "execution" && executionId && /* @__PURE__ */ jsx(ExecutionViewer, { executionId })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsx("header", { className: "bg-white shadow-sm border-b border-gray-200 px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Play, { className: "w-6 h-6 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Agentic Workflow Builder" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Phase 4: Collaboration & Marketplace" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: goToBuilder,
            className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentView === "builder" && location.pathname === "/" ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(Play, { className: "w-4 h-4" }),
              "Builder"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: goToList,
            className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentView === "list" && location.pathname === "/" ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(List, { className: "w-4 h-4" }),
              "Workflows"
            ]
          }
        ),
        executionId && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: goToExecution,
            className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentView === "execution" && location.pathname === "/" ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }),
              "Execution"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/marketplace",
            className: "px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Store, { className: "w-4 h-4" }),
              "Marketplace"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/log",
            className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${location.pathname === "/log" ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
              "Log"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/analytics",
            className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${location.pathname === "/analytics" ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
              "Analytics"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/settings",
            className: `px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${location.pathname === "/settings" ? "bg-primary-100 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`,
            children: [
              /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" }),
              "Settings"
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "ml-4 pl-4 border-l border-gray-300 flex items-center gap-2", children: isAuthenticated ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg", children: [
            /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-gray-600" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: user?.username })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: async () => {
                if (isLogoutPending) return;
                setIsLogoutPending(true);
                const confirmed = await showConfirm(
                  "Do you really want to log out? Any unsaved workflows will remain in draft but may be lost if you close the tab.",
                  { title: "Confirm Logout", confirmText: "Log out", cancelText: "Cancel", type: "danger" }
                );
                setIsLogoutPending(false);
                if (confirmed) {
                  logout();
                }
              },
              className: "p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
              title: "Logout",
              children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" })
            }
          )
        ] }) : /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/auth",
            className: "px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors",
            children: [
              /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4" }),
              "Sign In"
            ]
          }
        ) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsx(
        Route,
        {
          index: true,
          element: renderBuilderContent()
        }
      ),
      /* @__PURE__ */ jsx(Route, { path: "marketplace", element: /* @__PURE__ */ jsx(MarketplacePage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "log", element: /* @__PURE__ */ jsx(LogPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "analytics", element: /* @__PURE__ */ jsx(AnalyticsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "settings", element: /* @__PURE__ */ jsx(SettingsPage, {}) })
    ] }) })
  ] });
}
function App() {
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      logger.error("Unhandled promise rejection:", event.reason);
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
  return /* @__PURE__ */ jsx(
    ErrorBoundary,
    {
      onError: (error, errorInfo) => {
        logger.error("ErrorBoundary caught error:", error, errorInfo);
      },
      children: /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(Router, { children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs(Routes, { children: [
        /* @__PURE__ */ jsx(Route, { path: "/auth", element: /* @__PURE__ */ jsx(AuthPage, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "/forgot-password", element: /* @__PURE__ */ jsx(ForgotPasswordPage, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "/reset-password", element: /* @__PURE__ */ jsx(ResetPasswordPage, {}) }),
        /* @__PURE__ */ jsx(Route, { path: "/*", element: /* @__PURE__ */ jsx(AuthenticatedLayout, {}) })
      ] }) }) }) })
    }
  );
}
var stdin_default = App;
export {
  stdin_default as default
};
