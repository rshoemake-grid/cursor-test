import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Provider } from "react-redux";
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
import { CanvasClipboardProvider } from "./contexts/CanvasClipboardContext";
import { store } from "./redux/store";
import {
  Play,
  List,
  Eye,
  Store,
  User,
  LogOut,
  LogIn,
  Settings,
  FileText,
  BarChart3,
} from "lucide-react";
import { showConfirm } from "./utils/confirm";
import { logger } from "./utils/logger";
import {
  LayoutRoot,
  Header,
  HeaderInner,
  BrandRow,
  LogoMark,
  TitleBlock,
  Title,
  Subtitle,
  Nav,
  NavTabButton,
  NavRouteLink,
  UserSection,
  UserBadge,
  UserName,
  LogoutButton,
  SignInLink,
  Main,
} from "./App.styled";
import { STORAGE_KEYS } from "./config/constants";

function AuthSessionRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const onUnauthorized = () => {
      if (location.pathname === "/auth") {
        return;
      }
      const from = `${location.pathname}${location.search}${location.hash}`;
      navigate("/auth", {
        replace: true,
        state: { sessionExpired: true, from },
      });
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", onUnauthorized);
    };
  }, [navigate, location.pathname, location.search, location.hash]);
  return null;
}

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

  useLayoutEffect(() => {
    const persistReturnContext = () => {
      try {
        const payload = {
          pathname: location.pathname,
          search: location.search || "",
          hash: location.hash || "",
          currentView,
          executionId,
          selectedWorkflowId,
        };
        sessionStorage.setItem(
          STORAGE_KEYS.AUTH_RETURN_CONTEXT,
          JSON.stringify(payload),
        );
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("auth:unauthorized", persistReturnContext, true);
    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        persistReturnContext,
        true,
      );
    };
  }, [
    location.pathname,
    location.search,
    location.hash,
    currentView,
    executionId,
    selectedWorkflowId,
  ]);

  useEffect(() => {
    const r = location.state?.authRestore;
    if (!r || typeof r !== "object") {
      return;
    }
    if (location.pathname !== "/") {
      navigate(`${location.pathname}${location.search || ""}`, {
        replace: true,
        state: {},
      });
      return;
    }
    const v = r.currentView;
    if (v === "list" || v === "builder" || v === "execution") {
      setCurrentView(v);
    }
    if (r.executionId) {
      setExecutionId(r.executionId);
    }
    if (r.selectedWorkflowId) {
      setSelectedWorkflowId(r.selectedWorkflowId);
      setWorkflowLoadKey((k) => k + 1);
    }
    navigate(`${location.pathname}${location.search || ""}`, {
      replace: true,
      state: {},
    });
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    const workflowId = searchParams.get("workflow");
    const executionIdParam = searchParams.get("execution");
    if (
      isAuthenticated &&
      workflowId &&
      workflowId !== processedWorkflowFromUrl.current
    ) {
      logger.debug(`[App] Loading workflow ${workflowId} from URL`);
      processedWorkflowFromUrl.current = workflowId;
      workflowLoadKeyRef.current += 1;
      const newKey = workflowLoadKeyRef.current;
      logger.debug(
        `[App] Incrementing workflowLoadKey: ${newKey - 1} → ${newKey}`,
      );
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
  }, [searchParams, navigate, location, executionId, isAuthenticated]);

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
    // New key so useTabInitialization is not blocked by processedKeys after URL load,
    // closed tabs, or reopening the same workflow from the list.
    setWorkflowLoadKey((k) => k + 1);
    setCurrentView("builder");
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView("builder");
  }, []);

  const builderActive = currentView === "builder" && location.pathname === "/";
  const listActive = currentView === "list" && location.pathname === "/";
  const executionActive =
    currentView === "execution" && location.pathname === "/";

  const renderBuilderContent = () => (
    <WorkflowTabsProvider>
      {currentView === "builder" && (
        <CanvasClipboardProvider>
          <WorkflowTabs
            initialWorkflowId={selectedWorkflowId}
            workflowLoadKey={workflowLoadKey}
            onExecutionStart={handleExecutionStart}
          />
        </CanvasClipboardProvider>
      )}
      {currentView === "list" && (
        <WorkflowList
          onSelectWorkflow={handleSelectWorkflow}
          onBack={handleBackToList}
        />
      )}
      {currentView === "execution" && executionId && (
        <ExecutionViewer executionId={executionId} />
      )}
    </WorkflowTabsProvider>
  );

  const handleLogoutClick = async () => {
    if (isLogoutPending) return;
    setIsLogoutPending(true);
    const confirmed = await showConfirm(
      "Do you really want to log out? Any unsaved workflows will remain in draft but may be lost if you close the tab.",
      {
        title: "Confirm Logout",
        confirmText: "Log out",
        cancelText: "Cancel",
        type: "danger",
      },
    );
    setIsLogoutPending(false);
    if (confirmed) {
      logout();
    }
  };

  return (
    <LayoutRoot>
      <Header>
        <HeaderInner>
          <BrandRow>
            <LogoMark>
              <Play />
            </LogoMark>
            <TitleBlock>
              <Title>Agentic Workflow Builder</Title>
              <Subtitle>Phase 4: Collaboration & Marketplace</Subtitle>
            </TitleBlock>
          </BrandRow>

          <Nav>
            <NavTabButton
              type="button"
              $active={builderActive}
              onClick={goToBuilder}
            >
              <Play />
              Builder
            </NavTabButton>
            <NavTabButton type="button" $active={listActive} onClick={goToList}>
              <List />
              Workflows
            </NavTabButton>
            {executionId && (
              <NavTabButton
                type="button"
                $active={executionActive}
                onClick={goToExecution}
              >
                <Eye />
                Execution
              </NavTabButton>
            )}
            <NavRouteLink to="/marketplace">
              <Store />
              Marketplace
            </NavRouteLink>
            <NavRouteLink to="/log" $active={location.pathname === "/log"}>
              <FileText />
              Log
            </NavRouteLink>
            <NavRouteLink
              to="/analytics"
              $active={location.pathname === "/analytics"}
            >
              <BarChart3 />
              Analytics
            </NavRouteLink>
            <NavRouteLink
              to="/settings"
              $active={location.pathname === "/settings"}
            >
              <Settings />
              Settings
            </NavRouteLink>

            <UserSection>
              {isAuthenticated ? (
                <>
                  <UserBadge>
                    <User />
                    <UserName>{user?.username}</UserName>
                  </UserBadge>
                  <LogoutButton
                    type="button"
                    onClick={handleLogoutClick}
                    title="Logout"
                  >
                    <LogOut />
                  </LogoutButton>
                </>
              ) : (
                <SignInLink to="/auth">
                  <LogIn />
                  Sign In
                </SignInLink>
              )}
            </UserSection>
          </Nav>
        </HeaderInner>
      </Header>

      <Main>
        <Routes>
          <Route index element={renderBuilderContent()} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="log" element={<LogPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </Main>
    </LayoutRoot>
  );
}

function App() {
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      logger.error("Unhandled promise rejection:", event.reason);
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error("ErrorBoundary caught error:", error, errorInfo);
      }}
    >
      <Provider store={store}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <AuthSessionRedirect />
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/*" element={<AuthenticatedLayout />} />
            </Routes>
          </AuthProvider>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
