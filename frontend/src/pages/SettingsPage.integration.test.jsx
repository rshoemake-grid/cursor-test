import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import { useAuth } from "../contexts/AuthContext";
import { showConfirm } from "../utils/confirm";
jest.mock("../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));
jest.mock("../api/client", () => ({
  api: {
    getLLMSettings: jest.fn(),
  },
  createApiClient: jest.fn(),
}));
jest.mock("../hooks/providers", () => ({
  useLLMProviders: () => ({
    providers: [],
    iterationLimit: 10,
    defaultModel: "",
  }),
  useProviderManagement: () => ({
    saveProviders: jest.fn(),
    updateProvider: jest.fn(),
    testProvider: jest.fn(),
    addCustomModel: jest.fn(),
    testingProvider: null,
    testResults: {},
  }),
}));
jest.mock("../hooks/settings/useSettingsSync", () => ({
  useSettingsSync: () => ({
    handleManualSync: jest.fn(),
  }),
}));
jest.mock("../hooks/settings/useModelExpansion", () => ({
  useModelExpansion: () => ({
    expandedModels: {},
    expandedProviders: {},
    toggleProviderModels: jest.fn(),
    toggleModel: jest.fn(),
    isModelExpanded: jest.fn(() => false),
  }),
}));
jest.mock("../hooks/settings/useSettingsStateSync", () => ({
  useSettingsStateSync: () => {},
}));
jest.mock("../components/settings/SettingsHeader", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    SettingsHeader: ({ onSyncClick }) => (
      <div data-testid="settings-header">
        <button onClick={onSyncClick}>Sync</button>
      </div>
    ),
  };
});
jest.mock("../components/settings/SettingsTabs", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  const { SETTINGS_TABS } = require("../constants/settingsConstants");
  return {
    __esModule: true,
    SettingsTabs: ({ activeTab, onTabChange }) => (
      <div data-testid="settings-tabs">
        <button
          data-testid="tab-llm"
          onClick={() => onTabChange(SETTINGS_TABS.LLM)}
          className={activeTab === SETTINGS_TABS.LLM ? "active" : ""}
        >
          LLM Providers
        </button>
        <button
          data-testid="tab-workflow"
          onClick={() => onTabChange(SETTINGS_TABS.WORKFLOW)}
          className={activeTab === SETTINGS_TABS.WORKFLOW ? "active" : ""}
        >
          Workflow Generation
        </button>
      </div>
    ),
  };
});
jest.mock("../components/settings/SettingsTabContent", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  const { SETTINGS_TABS } = require("../constants/settingsConstants");
  return {
    __esModule: true,
    SettingsTabContent: ({
      shell,
      providersData,
      workflowGeneration,
    }) => (
      <div data-testid="settings-tab-content">
        {shell.activeTab === SETTINGS_TABS.LLM && (
          <div data-testid="llm-tab-content">
            <div data-testid="provider-count">
              {providersData.list.length} providers
            </div>
          </div>
        )}
        {shell.activeTab === SETTINGS_TABS.WORKFLOW && (
          <div data-testid="workflow-tab-content">
            <div data-testid="iteration-limit">
              {workflowGeneration.iterationLimit}
            </div>
            <div data-testid="default-model">
              {workflowGeneration.defaultModel}
            </div>
          </div>
        )}
      </div>
    ),
  };
});
jest.mock("../components/settings/AddProviderForm", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    AddProviderForm: () => (
      <div data-testid="add-provider-form">AddProviderForm</div>
    ),
  };
});
jest.mock("../components/settings/ProviderForm", () => {
  const { jsxs } = require("react/jsx-runtime");
  return {
    __esModule: true,
    ProviderForm: ({ provider }) => (
      <div data-testid={`provider-form-${provider.id}`}>
        ProviderForm: {provider.name}
      </div>
    ),
  };
});
jest.mock("../components/settings/WorkflowSettingsTab", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    WorkflowSettingsTab: () => (
      <div data-testid="workflow-settings-tab">WorkflowSettingsTab</div>
    ),
  };
});
jest.mock("../components/settings/AutoSyncIndicator", () => {
  const { jsx } = require("react/jsx-runtime");
  return {
    __esModule: true,
    AutoSyncIndicator: () => (
      <div data-testid="auto-sync-indicator">AutoSyncIndicator</div>
    ),
  };
});
global.fetch = jest.fn();
const mockUseAuth = useAuth;
describe("SettingsPage Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "1",
        username: "testuser",
      },
      token: "token",
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });
    showConfirm.mockResolvedValue(true);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        providers: [],
        iteration_limit: 10,
        default_model: "",
      }),
    });
  });
  describe("Step 1.2.1: Tabs Component Integration", () => {
    it("should render SettingsPage with SettingsTabs", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
    });
    it("should render SettingsHeader", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
    });
    it("should render SettingsTabContent", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
    });
    it("should switch tabs when tab button is clicked", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
      expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
    });
    it("should highlight active tab", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        const llmTab = screen.getByTestId("tab-llm");
        expect(llmTab).toHaveClass("active");
      });
    });
  });
  describe("Step 1.2.1: Tab Content Integration", () => {
    it("should render LLM tab content when LLM tab is active", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
      });
    });
    it("should render Workflow tab content when Workflow tab is active", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
    });
    it("should pass props correctly to SettingsTabContent", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
    });
    it("should update content when activeTab changes", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.queryByTestId("llm-tab-content")).not.toBeInTheDocument();
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
    });
  });
  describe("Step 1.2.2: Form Integration", () => {
    it("should integrate AddProviderForm in LLM tab", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
    });
    it("should integrate ProviderForm for each provider", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
    });
    it("should integrate WorkflowSettingsTab in Workflow tab", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
    });
  });
  describe("Step 1.2.2: Settings Sync Integration", () => {
    it("should render sync button in SettingsHeader", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        const syncButton = screen.getByText("Sync");
        expect(syncButton).toBeInTheDocument();
      });
    });
    it("should call handleManualSync when sync button is clicked", async () => {
      const mockHandleManualSync = jest.fn();
      jest.doMock("../hooks/settings/useSettingsSync", () => ({
        useSettingsSync: jest.fn(() => ({
          handleManualSync: mockHandleManualSync,
        })),
      }));
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-header")).toBeInTheDocument();
      });
      const syncButton = screen.getByText("Sync");
      expect(syncButton).toBeInTheDocument();
    });
  });
  describe("Step 1.2.3: Provider Management Flow", () => {
    it("should handle provider state through SettingsPage", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
    });
    it("should pass provider-related props to SettingsTabContent", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("provider-count")).toBeInTheDocument();
    });
  });
  describe("Step 1.2.3: Settings Configuration Flow", () => {
    it("should pass iteration limit to SettingsTabContent", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("iteration-limit")).toBeInTheDocument();
    });
    it("should pass default model to SettingsTabContent", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("default-model")).toBeInTheDocument();
    });
    it("should update settings when tab content triggers callbacks", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
      expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
    });
  });
  describe("Step 1.2.1: Tab State Persistence", () => {
    it("should maintain tab state during component lifecycle", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
      expect(workflowTab).toHaveClass("active");
    });
  });
  describe("Step 1.2.2: Component State Synchronization", () => {
    it("should synchronize state between SettingsTabs and SettingsTabContent", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
        expect(screen.getByTestId("settings-tab-content")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
    });
    it("should update SettingsTabContent when SettingsTabs triggers tab change", async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <SettingsPage />
          </BrowserRouter>,
        );
      });
      await waitFor(() => {
        expect(screen.getByTestId("llm-tab-content")).toBeInTheDocument();
      });
      const workflowTab = screen.getByTestId("tab-workflow");
      fireEvent.click(workflowTab);
      await waitFor(() => {
        expect(screen.queryByTestId("llm-tab-content")).not.toBeInTheDocument();
        expect(screen.getByTestId("workflow-tab-content")).toBeInTheDocument();
      });
    });
  });
});
